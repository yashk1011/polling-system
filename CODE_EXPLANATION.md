# Live Polling System – Code Explanation

This document explains the structure and behavior of the **backend** and **frontend** in this project. It focuses on what each file does, how data flows, and how real-time behavior works.

> Note: Line numbers are approximate because formatting can change, but explanations are grouped by logical blocks (imports, functions, etc.).

---

## 1. Backend Overview (`backend/`)

### 1.1 Entry Point – `src/server.ts`

**Imports**
- Imports Express, Node's HTTP server, Socket.io, CORS, dotenv, the Mongo connection helper, poll routes, error middleware, and `PollSocketHandler`.

**Environment setup**
- `dotenv.config()` loads environment variables from `.env` so `PORT`, `MONGODB_URI`, etc. are available.

**Express app and HTTP server**
- `const app: Application = express();` creates the Express instance.
- `const httpServer = createServer(app);` wraps it in a Node HTTP server so Socket.io can attach to the same port.

**Socket.io server**
- `const io = new Server(httpServer, { cors: { ... } });` creates a Socket.io server:
  - Uses `CORS_ORIGIN` env (or `http://localhost:5173`) to allow your React app to connect.
  - Limits methods to GET/POST and enables credentials.

**Middleware**
- `app.use(cors(...))` enables CORS for HTTP API.
- `app.use(express.json())` parses JSON request bodies.
- `app.use(express.urlencoded({ extended: true }))` parses URL-encoded forms.

**Health check route**
- `app.get('/health', ...)` returns `{ status: 'ok', timestamp: ... }` so you can quickly test if the backend is alive.

**API routes**
- `app.use('/api/polls', pollRoutes);` mounts all poll-related endpoints under `/api/polls`.

**Error handling**
- `app.use(errorHandler);` plugs in a centralized error middleware (e.g., to format errors consistently).

**Socket.io handler**
- `const pollSocketHandler = new PollSocketHandler(io);` creates the handler class instance.
- `io.on('connection', (socket) => pollSocketHandler.handleConnection(socket));` wires every new socket connection into the handler.

**Server startup**
- `const PORT = process.env.PORT || 5000;` picks the port.
- `startServer()`:
  - Calls `connectDatabase()` to connect to MongoDB using `MONGODB_URI`.
  - On success, calls `httpServer.listen(PORT, ...)` to start listening.
  - Logs environment and status.
  - On failure, logs and exits.

**Graceful shutdown**
- Listens to `SIGTERM` and closes the HTTP server cleanly when the process is terminated (useful in production).

---

### 1.2 Data Models – `src/models/`

#### `Poll.model.ts`

Defines the MongoDB collection for polls.

- Uses a Mongoose `Schema` with fields:
  - `question: string` – required.
  - `options: string[]` – required with validator to ensure **2–4 options**.
  - `correctOptionIndex: number` – index of correct option (0–3).
  - `timerDuration: number` – required, range 10–300 seconds.
  - `status: 'active' | 'completed'` – default `'active'`.
  - `startedAt: Date` – when the poll began.
  - `createdAt: Date` – document creation time.
- Adds an **index** on `{ status: 1, startedAt: -1 }` for efficient `findOne({ status: 'active' })` queries.
- Exports a Mongoose model `Poll` which exposes standard CRUD operations.

#### `Vote.model.ts`

Defines the MongoDB collection for individual votes.

- Fields:
  - `pollId: ObjectId` – reference to `Poll`.
  - `studentName: string` – who voted (per tab).
  - `selectedOption: number` – index of chosen option.
  - `timestamp: Date` – when the vote happened.
- **Unique compound index** on `{ pollId: 1, studentName: 1 }`:
  - Guarantees a student can only vote **once per poll** at the DB level (race-condition protection).
- Additional index on `{ pollId: 1, selectedOption: 1 }` for faster aggregation.

---

### 1.3 Types – `src/types` (backend)

(Not shown in full, but generally defines TypeScript interfaces such as `IPoll`, `IVote`, `PollResults`, `ActivePollResponse` used by the service layer.)

These give structure to data returned by the service functions and keep code type-safe.

---

### 1.4 Business Logic – `src/services/PollService.ts`

`PollService` is a class encapsulating all poll-related business rules. Each method returns plain JS objects or throws errors; controllers and sockets call into this.

#### `createPoll(question, options, correctOptionIndex, timerDuration)`

- Checks for an existing active poll via `Poll.findOne({ status: 'active' })`.
- If one exists, throws an error: "An active poll already exists...".
- Otherwise, creates a new `Poll` with:
  - Provided `question`, `options`, `correctOptionIndex`, `timerDuration`.
  - `status: 'active'`, `startedAt: new Date()`.
- Saves it to Mongo and returns `poll.toObject()`.

#### `getActivePoll(studentName?)`

- `Poll.findOne({ status: 'active' })` – if none, returns `null` (used for state-recovery).
- Computes seconds elapsed based on `startedAt` and current time.
- `remainingTime = max(0, timerDuration - elapsed)`; ensures late joiners get reduced timers.
- Calls `getPollResults(poll._id)` to get aggregate results.
- If `studentName` is provided, checks `Vote.findOne({ pollId, studentName })` to determine `hasVoted`.
- Returns `{ poll: poll.toObject(), results, remainingTime, hasVoted }`.

#### `submitVote(pollId, studentName, selectedOption)`

- Validates poll exists and is active.
- Checks if time has expired: `elapsed >= poll.timerDuration` → throws "Time limit exceeded".
- Validates `selectedOption` is within the options array.
- Checks for existing vote with `{ pollId, studentName }`.
  - If exists, throws "You have already voted on this poll".
- Creates and saves a new `Vote` document.

#### `getPollResults(pollId)`

- Fetches the poll to get question text and options.
- Aggregates votes via `Vote.aggregate`:
  - Groups by `selectedOption` and counts votes.
- Builds a `voteCounts` map and `totalVotes`.
- For each poll option index, calculates:
  - `count` – number of votes.
  - `percentage = round((count / totalVotes) * 100)`.
- Returns a `PollResults` object with poll ID, question, options, `votes[]`, `totalVotes`, and status.

#### `endPoll(pollId)`

- Finds the poll by ID, sets `status = 'completed'`, and saves.

#### `getPollHistory()`

- Finds up to 20 completed polls sorted newest first.
- For each poll, calls `getPollResults` to compute results.
- Returns an array of `{ poll, results }` used by the frontend history view.

#### `checkAllStudentsAnswered(pollId)`

- Stub currently returning `false` – left for future enhancement to enforce "ask new question only when all students have answered".

---

### 1.5 Controllers – `src/controllers/PollController.ts`

Wraps service functions as HTTP endpoints with validation and HTTP status codes.

#### `createPoll(req, res)` (`POST /api/polls`)

- Extracts `question`, `options`, `timerDuration`, `correctOptionIndex` from `req.body`.
- Validates:
  - All required fields are present.
  - `options` length between 2–4.
  - `timerDuration` between 10–300.
  - `correctOptionIndex` within option bounds.
- Calls `PollService.createPoll(...)`.
- On success, responds with `201` and `{ success: true, poll }`.
- On error, responds with `400` and `{ error: error.message }`.

#### `getActivePoll(req, res)` (`GET /api/polls/active`)

- Reads optional `studentName` from query params.
- Calls `PollService.getActivePoll(studentName)`.
- If no active poll, returns `404` with `"No active poll found"`.
- Else, returns `200` with `{ success: true, data: activePoll }`.

#### `getPollResults(req, res)` (`GET /api/polls/:pollId/results`)

- Reads `pollId` from `req.params`.
- Calls `PollService.getPollResults(pollId)`.
- Returns `200` with `results` or `404` with error.

#### `getPollHistory(req, res)` (`GET /api/polls/history`)

- Calls `PollService.getPollHistory()`.
- Returns `200` with `{ success: true, history }` or `500` on error.

#### `endPoll(req, res)` (`POST /api/polls/:pollId/end`)

- Calls `PollService.endPoll(pollId)` and returns a success message.

---

### 1.6 Routes – `src/routes/poll.routes.ts`

Defines HTTP endpoints and attaches them to `PollController` methods:

- `POST /` → `createPoll`
- `GET /active` → `getActivePoll`
- `GET /history` → `getPollHistory`
- `GET /:pollId/results` → `getPollResults`
- `POST /:pollId/end` → `endPoll`

Uses `bind(this)` to maintain controller `this` context.

---

### 1.7 Socket Handlers – `src/handlers/PollSocketHandler.ts`

This class defines how real-time events behave over Socket.io.

**State fields**
- `pollTimers: Map<pollId, Timeout>` – tracks auto-end timers per poll.
- `usersBySocket: Map<socketId, ConnectedUser>` – tracks connected teachers and students.

#### `broadcastStudentList()`

- Filters `usersBySocket` to only students.
- Emits `student-list` with `{ students }` to **all** connected clients (teachers use it in Participants view).

#### `handleConnection(socket)`

Called for every new WebSocket connection.

1. Logs `Client connected: <id>`.

2. **identify** (`identify`, from frontend):
   - Payload: `{ name, role }` where `role` is `'teacher'` or `'student'`.
   - Stores in `usersBySocket` keyed by `socket.id`.
   - Calls `broadcastStudentList()` to update teacher dashboards.

3. **create-poll** (teacher):
   - Payload: `{ question, options, correctOptionIndex, timerDuration }`.
   - Calls `PollService.createPoll(...)`.
   - Emits `poll-started` to **all** clients with `{ poll, remainingTime: timerDuration }`.
   - Calls `setAutoPollEnd(pollId, timerDuration)` to schedule auto end.

4. **submit-vote** (student):
   - Payload: `{ pollId, studentName, selectedOption }`.
   - Calls `PollService.submitVote(...)` for validation and persistence.
   - Fetches fresh results via `getPollResults`.
   - Emits `poll-update` globally with `{ results }`.
   - Emits `vote-recorded` back to the sender.

5. **end-poll** (teacher):
   - Payload: `{ pollId }`.
   - Calls `endPoll` service.
   - Clears any active timer in `pollTimers`.
   - Fetches final results.
   - Emits `poll-ended` globally with `{ pollId, results }`.

6. **join-poll** (student):
   - Payload: `{ studentName }`.
   - Calls `PollService.getActivePoll(studentName)`.
   - If a poll exists, emits **only to this socket**:
     - `poll-started` with `{ poll, remainingTime, hasVoted, results }`.
   - Supports **late join** and **state recovery**.

7. **remove-student** (teacher):
   - Payload: `{ studentId }` (socket ID).
   - Finds that socket.
   - Emits `removed` to the student, then disconnects them and broadcasts updated student list.

8. **chat-message** (teacher or student):
   - Payload: `{ message }`.
   - Looks up the `ConnectedUser` by `socket.id`.
   - Builds message payload with id, trimmed message, sender name, role, and timestamp.
   - Emits `chat-message` to **all** sockets.

9. **disconnect**:
   - Logs client disconnect.
   - Removes the user from `usersBySocket` and updates `student-list`.

#### `setAutoPollEnd(pollId, duration)`

- Uses `setTimeout` for `duration * 1000` ms.
- Calls `PollService.endPoll` and `getPollResults` when time elapses.
- Emits `poll-ended` with final results.
- Deletes the timer from `pollTimers`.

---

## 2. Frontend Overview (`frontend/`)

### 2.1 Entry and Routing – `src/main.tsx` and `src/App.tsx`

#### `src/main.tsx`

- Imports React, ReactDOM, global CSS.
- Calls `createRoot(document.getElementById('root')!)` and renders `<App />` inside `<StrictMode>`.

#### `src/App.tsx`

- Uses `BrowserRouter`, `Routes`, and `Route` from `react-router-dom`.
- Defines routes:
  - `/` → `Landing` (role selection screen).
  - `/teacher` → `TeacherDashboard`.
  - `/student` → `StudentView`.
  - `*` → redirect to `/`.

---

### 2.2 Global styles – `src/index.css` and `src/App.css`

- `index.css` sets base font (`Inter`), light color-scheme, and removes margins.
- `App.css`:
  - Resets global box model.
  - Styles `body` with Inter, light background `#f7f7fb`, text color `#111827`.
  - Provides shared styles for error banners and notifications, and base `button`/`input` appearance.

---

### 2.3 Type Definitions – `src/types/index.ts`

Defines front-end TypeScript types that mirror backend responses:

- `Poll` – poll metadata (id, question, options, timerDuration, status, startedAt, createdAt).
- `Vote` – option label, count, percentage.
- `PollResults` – question, options, votes, totalVotes, status.
- `ActivePollResponse` – `{ poll, results, remainingTime, hasVoted? }`.
- `PollHistoryItem` – `{ poll, results }` for poll history.

---

### 2.4 API Client – `src/services/api.ts`

- Creates an Axios instance with base URL from `VITE_API_URL`.
- `pollApi.getActivePoll(studentName?)`:
  - Requests `/polls/active` with optional `studentName` query.
  - Returns `null` if backend responds `404`.
- `pollApi.getPollHistory()` – calls `/polls/history` and returns `history` array.
- `pollApi.createPoll(...)` – (available as REST fallback) posts a new poll object including `correctOptionIndex` and `timerDuration`.
- `pollApi.endPoll(pollId)` – posts to `/polls/:pollId/end`.

---

### 2.5 Hooks – `src/hooks/`

#### `useSocket.ts`

Encapsulates the Socket.io client logic.

- Reads `VITE_SOCKET_URL` from env or defaults to `http://localhost:5000`.
- On mount, creates a `socketInstance` via `io(SOCKET_URL, { transports, reconnection, ... })`.
- Registers handlers:
  - `connect` → sets `isConnected = true`.
  - `disconnect` → sets `isConnected = false`.
  - `connect_error` / `error` → sets a human-readable `error` message.
- Exposes:
  - `emit(event, data)` – sends events only when connected.
  - `on(event, handler)` – attaches event listeners.
  - `off(event, handler?)` – removes listeners.

#### `usePollState.ts`

Keeps poll state in sync with backend REST.

- State: `activePoll`, `results`, `remainingTime`, `hasVoted`, `loading`, `error`.
- `fetchActivePoll()`:
  - Calls `pollApi.getActivePoll(studentName)`.
  - If there is an active poll, populates state with poll, results, remainingTime, hasVoted.
  - If not, clears state.
- `useEffect` on mount calls `fetchActivePoll()` – this implements **state recovery** after refresh.
- Helper functions:
  - `updatePoll(poll, time)` – sets new active poll and timer.
  - `updateResults(newResults)` – updates results.
  - `markAsVoted()` – marks current student as having voted.
  - `clearPoll()` – clears poll state.

#### `usePollTimer.ts`

(Used in student question component.)

- Manages a countdown timer starting from `initialTime`.
- Decrements each second using `setInterval`.
- Calls `onTimeout` when it reaches zero.
- Provides `formattedTime` (e.g., `0:45`).

---

### 2.6 Landing Page – `src/components/Landing.tsx` & `.css`

- Renders the welcome screen with role choices:
  - Two role cards: "I'm a Student" and "I'm a Teacher".
- Uses local state `selectedRole` (`'student'` or `'teacher'`).
- On **Continue**, navigates to `/student` or `/teacher` via `useNavigate()`.
- Styles use a centered card, pill "Intervue Poll" badge, and responsive grid.

---

### 2.7 Teacher Flow – `src/components/teacher/`

#### `TeacherDashboard.tsx`

- Hooks:
  - `useSocket()` to get `emit`, `on`, `off`, `isConnected`, `socketError`.
  - `usePollState({ isTeacher: true })` to manage poll + timer + results.
- Local state:
  - `showHistory` – toggles between Live Results and History.
  - `notification` – ephemeral success/info messages.
  - `students[]` – list of { id, name } from server.

**Identify as teacher**
- `useEffect` on `isConnected` emits `identify` with `{ name: 'Teacher', role: 'teacher' }`.

**Socket listeners**
- `poll-started` → calls `updatePoll(poll, remainingTime)`, shows notification.
- `poll-update` → `updateResults(results)`.
- `poll-ended` → updates results, `clearPoll()`, shows notification.
- `student-list` → keeps `students` array in sync.

**Event handlers**
- `handleCreatePoll(question, options, correctIndex, timer)`:
  - Emits `create-poll` socket event.
- `handleEndPoll()`:
  - Emits `end-poll` with current `pollId`.
- `handleRemoveStudent(id)`:
  - Emits `remove-student` with `studentId`.

**Render**
- Header with title and connection status.
- Toggle button `Show History` / `Show Live Poll`.
- Main content:
  - If not history:
    - `CreatePollForm` card.
    - `LiveResults` card and `End Poll Now` button.
  - If history:
    - `PollHistory` full-width card.
- `ChatPopup` at bottom-right with teacher role, students list, and ability to kick.

#### `CreatePollForm.tsx`

- Form state: `question`, `options[]` (2–4), `correctOptionIndex`, `timerDuration`, `errors[]`.
- Functions:
  - `handleAddOption()` – adds a new empty option up to 4.
  - `handleOptionChange(i, value)` – updates specific option.
  - `validate()` – ensures question, all option fields filled, at least 2.
  - `handleSubmit()` – validates and then calls `onCreatePoll(...)` from props.
- Renders the "Let's Get Started" layout with:
  - Question textarea and character count.
  - Timer dropdown.
  - List of options, each with Yes/No correctness toggle.
  - `+ Add More option` and bottom-right `Ask Question` button.

#### `LiveResults.tsx`

- Accepts `results` and `remainingTime`.
- If no results, shows "No active poll" message.
- Otherwise displays:
  - Header with "Live Results" and formatted time.
  - Question and total votes.
  - For each vote:
    - Label row with option text and `count (percentage%)`.
    - Colored bar representing `percentage` width.

#### `PollHistory.tsx`

- On mount, calls `pollApi.getPollHistory()`.
- Shows loading, error, or "No poll history yet" states.
- Renders list of history cards, each with:
  - Question and created date/time.
  - Per-option rows with option, percentage, and vote count.

---

### 2.8 Student Flow – `src/components/student/`

#### `StudentView.tsx`

- State:
  - `studentName` (from `sessionStorage` for per-tab identity).
  - `error` message.
- Hooks:
  - `useSocket()` for realtime.
  - `usePollState({ studentName })` for current poll and results.

**On mount**
- Loads `studentName` from `sessionStorage` if present.

**When studentName + socket is ready**
- Emits `identify` with `{ name: studentName, role: 'student' }`.
- Emits `join-poll` so backend can send active poll state.

**Socket listeners**
- `poll-started` → `updatePoll(poll, remainingTime)`, sets `hasVoted` if true.
- `poll-update` → `updateResults(results)`.
- `poll-ended` → shows results then clears poll after 5s.
- `vote-recorded` → calls `markAsVoted()` and clears errors.
- `error` → shows error banner.
- `removed` → shows reason, clears `studentName`, and clears session storage.

**User actions**
- `handleNameSubmit(name)` → sets `studentName` and stores it.
- `handleSubmitVote(optionIndex)` → emits `submit-vote` with poll ID, studentName, and option index.

**Render**
- If no `studentName`, shows `StudentOnboarding` card.
- Otherwise shows header with name and connection status.
- Content:
  - If there is an active poll and user has not voted → `PollQuestion`.
  - If user has voted or no active poll but results exist → `ResultsView`.
  - If no active poll or results → "Waiting for teacher to start a poll" with spinner.
- `ChatPopup` at bottom-right for student.

#### `StudentOnboarding.tsx`

- Controlled input for name with simple length validation.
- On submit, calls `onSubmit(name)` from props.

#### `PollQuestion.tsx`

- Props: `poll`, `remainingTime`, `onSubmitVote`, `hasVoted`.
- Local state: `selectedOption`, `isSubmitting`.
- Uses `usePollTimer` to display formatted countdown.
- Renders:
  - Dark question header with text and timer badge.
  - List of option buttons with numbered circle and text.
  - `Submit Vote` button (disabled until an option is selected).
- If `hasVoted` is true, shows a "Vote Submitted" message instead.

#### `ResultsView.tsx`

- Displays poll results to students after voting or when poll ends.
- Similar to teacher view but styled slightly differently with letter badges.

---

### 2.9 Common – `src/components/common/ChatPopup.tsx` & `.css`

- Floating chat/participants panel shared by teacher and students.

**Props**
- `role` – `'teacher'` or `'student'`.
- `students` / `onRemoveStudent` – used for Participants tab (teacher only).
- `emit`, `on`, `off`, `isConnected` – socket functions injected from parent components.

**State**
- `isOpen` – whether popup is visible.
- `activeTab` – `'chat'` or `'participants'`.
- `messages[]` – in-memory chat history.
- `input` – current text input.

**Effects**
- Subscribes to `chat-message` events and appends them to `messages`.
- Scrolls to bottom when new messages arrive.

**Sending messages**
- `handleSend()` trims `input`, checks connectivity, and emits `chat-message` with the message text.

**Participants tab** (teacher only)
- Shows a table: Name | Action.
- `Kick out` button calls `onRemoveStudent(id)` which emits `remove-student`.

**Styles**
- `chat-toggle` – round purple button fixed at bottom-right.
- `chat-window` – white card popup with tabs at the top, scrollable content, and input row at bottom.

---

## 3. End-to-End Data Flow Summary

1. **Teacher creates poll**
   - Frontend (TeacherDashboard) → `emit('create-poll', { question, options, correctOptionIndex, timerDuration })`.
   - Backend `PollSocketHandler` → `PollService.createPoll` → stores poll.
   - Backend emits `poll-started` to everyone.
   - Teacher and Student fronts update their state via `usePollState` and show the question.

2. **Students join late / refresh**
   - On page load or reconnect, student emits `join-poll` and `identify`.
   - Backend fetches active poll + remainingTime + hasVoted.
   - Emits `poll-started` only to that socket.

3. **Student votes**
   - Student emits `submit-vote`.
   - Backend validates poll, time, and duplicate vote.
   - Saves `Vote`, recalculates results, emits `poll-update` globally + `vote-recorded` to that student.
   - UIs update results in real time.

4. **Poll ends (auto or manual)**
   - Either auto-end via `setAutoPollEnd` or `end-poll` from teacher.
   - Backend sets poll `status` to `completed`, computes final results, and emits `poll-ended`.
   - UIs show final results and teacher can then see history.

5. **Chat**
   - Any connected teacher/student emits `chat-message`.
   - Backend tags it with sender’s name and role and broadcasts to all.
   - ChatPopup instances append to their `messages` list.

6. **Participants / Kick out**
   - When sockets identify or disconnect, backend recomputes student list and emits `student-list`.
   - Teacher dashboard receives and shows it in Participants.
   - Teacher clicks `Kick out` → emits `remove-student` → backend sends `removed` to that socket and disconnects it.

This should give you enough detail to explain how every part of the app works and how data moves between frontend and backend.
