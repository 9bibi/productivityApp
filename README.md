
# Habit Tracker Application

## Overview
This Habit Tracker application allows users to track their daily habits and progress over time, along with some additional features like a Pomodoro timer, weather updates, motivational quotes, and a searching for images. The application also includes an admin panel for managing users.

## Features
- **User Authentication & Authorization**: Users can log in and log out. Admin can create and manage other users on the admin dashboard. The admin page is only accessible for users who has logged in as an admin.
- **Habit Management**: Users can add, update, delete, and track habits.
- **Pomodoro Timer**: Track work and break sessions using the Pomodoro technique with integrations to Toggl.
- **Weather API**: Get real-time weather data for a given city.
- **Motivational Quote API**: Fetch motivational quotes to inspire users.
- **News API**: Fetch articles related to productivity and life.
- **Search Images & History**: Users can search for images and view their previous search history.

## Routes

### Authentication Routes

#### `GET /login`
Displays the login page.

#### `POST /login`
Handles user login. Sets a session for the user and redirects to the appropriate page (admin or main page).

#### `GET /logout`
Logs out the user by destroying the session.

### Habit Management Routes

#### `POST /addHabit`
Adds a new habit to the user's habits list. The habit includes details such as name, frequency, category, and goal.

#### `GET /getHabits`
Fetches all the user's habits.

#### `POST /updateProgress`
Updates the progress of a specific habit (completed days and streak).

#### `DELETE /deleteHabit`
Deletes a specified habit from the user's habits list.


### API Routes

#### `GET /weather/data`
Fetches real-time weather data for a specified city using the OpenWeatherMap API.

#### `GET /quote`
Fetches a random motivational quote using the API Ninjas API.

#### `GET /articles`
Fetches productivity-related articles from the NewsAPI.

#### `GET /timer`
Displays the Pomodoro timer page for the user.

#### `POST /timer/start`
Starts a Pomodoro session and records the time entry using the Toggl API.

#### `POST /timer/stop`
Stops the current Pomodoro session and records the duration.

#### `POST /search`
Searches for images based on a keyword using the Pexels API.

#### `GET /history`
Displays a list of previous search histories (images based on keyword searches).

### Admin Routes (Protected by Authentication)

#### `GET /admin`
Displays the admin dashboard with a list of all users.

#### `POST /admin/add`
Adds a new user (admin or regular) to the application.

#### `POST /admin/edit/:id`
Edits a user's details, such as username and admin status.

#### `POST /admin/delete/:id`
Deletes a user from the application (soft delete by updating the `deletedAt` field).

### Privacy Policy

#### `GET /privacy-policy`
Displays the privacy policy page of the application.

## Technologies Used
- **Frontend**: EJS (Embedded JavaScript)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **APIs**:
    - OpenWeatherMap API (for weather data)
    - API Ninjas API (for motivational quotes)
    - NewsAPI (for productivity-related articles)
    - Pexels API (for image searches)
    - Toggl API (for Pomodoro timer integration)

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/9bibi/productivityApp.git
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Access the app at [http://localhost:3000].

4. Username and Password for Login:
   username: adminayala
   password: 20051809

*** little detail that you must know:
    the habits adding, updating, deleting and any other way of interacting with it is not available on render hosting website(https://productivityapp-f6q9.onrender.com). Because this          functionality uses -> http://localhost:3000. Therefore, the render link doesn't consist that, but that's the only difference from the http://localhost:3000.

## Developers
Aibibi Nygymetolla, Ayala Zholdybayeva, Moldir Kapal


