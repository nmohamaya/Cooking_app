# Manual QA Testing Checklist - Issue #52

## Test Session Information

| Field | Value |
|-------|-------|
| **Test Date** | ____/____/____ |
| **Tester Name** | ________________ |
| **Device Model** | ________________ |
| **Android Version** | Android __ (API __) |
| **APK Version** | 1.0.0 |
| **Build ID** | ________________ |
| **Start Time** | __:__ |
| **End Time** | __:__ |

---

## Pre-Test Verification

- [ ] Device fully charged (> 50%)
- [ ] Device has adequate storage (> 500MB free)
- [ ] WiFi connection available and active
- [ ] Mobile data available as backup
- [ ] ADB installed and device connected
- [ ] Previous app version uninstalled
- [ ] APK file downloaded successfully
- [ ] Test environment is quiet (no interruptions)

---

## Test Category 1: Application Launch & Initialization

### 1.1 Initial Application Launch
**Objective:** Verify app starts correctly without crashes

**Steps:**
1. [ ] Tap MyRecipeApp icon on device
2. [ ] Observe initial loading screen
3. [ ] Watch for any error dialogs
4. [ ] Note startup time (should be < 3 seconds)

**Expected Results:**
- App launches without crashes
- Loading screen displays for 1-2 seconds
- No error messages appear
- Main screen loads completely
- All UI elements are visible

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 1.2 Application Navigation
**Objective:** Verify navigation menu works correctly

**Steps:**
1. [ ] Look for navigation options on main screen
2. [ ] Click each navigation tab/menu item
3. [ ] Verify screens load smoothly
4. [ ] Check for missing or broken tabs

**Expected Results:**
- All tabs/menu items are clickable
- Screens load without lag
- No duplicate navigation options
- Active tab is clearly indicated
- Back button works from each screen

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 1.3 Service Initialization
**Objective:** Verify backend services initialize properly

**Steps:**
1. [ ] Launch app and wait 5 seconds
2. [ ] Check device logs: `adb logcat | grep -i "recipe"`
3. [ ] Verify no initialization errors
4. [ ] Check that features are responsive

**Expected Results:**
- All services initialize without errors
- No warning messages in logs
- App remains responsive
- Features are fully functional

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 2: Recipe Management

### 2.1 Add Recipe Manually
**Objective:** Test manual recipe creation

**Test Case 1 - Simple Recipe:**
1. [ ] Navigate to "Add Recipe" or similar button
2. [ ] Enter recipe name: "Test Pasta"
3. [ ] Enter cuisine: "Italian"
4. [ ] Enter difficulty: "Easy"
5. [ ] Enter prep time: "10 minutes"
6. [ ] Enter cook time: "15 minutes"
7. [ ] Enter ingredients: "Pasta, Tomato Sauce, Basil"
8. [ ] Enter instructions: "Boil pasta, add sauce, serve"
9. [ ] Save recipe
10. [ ] Verify recipe appears in list

**Expected Results:**
- Form loads without errors
- All input fields are functional
- Can type in all fields
- Save button is clickable and works
- Recipe appears in list immediately

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - Recipe with Special Characters:**
1. [ ] Enter recipe name: "Café Mocha & Caramel Torte"
2. [ ] Include special characters in ingredients: "Café, Crème, Cinnamon"
3. [ ] Save recipe

**Expected Results:**
- Special characters display correctly
- Recipe saves successfully
- Special characters preserved in saved data
- No encoding errors

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 3 - Recipe with Long Description:**
1. [ ] Enter recipe with very long description (> 500 characters)
2. [ ] Save recipe
3. [ ] View recipe details

**Expected Results:**
- Long text displays without truncation issues
- Text wraps properly on screen
- All content is readable
- No layout breaks

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 2.2 View Recipe List
**Objective:** Verify recipes display correctly in list view

**Steps:**
1. [ ] Navigate to recipe list
2. [ ] Verify all recipes display
3. [ ] Check recipe card layout
4. [ ] Verify recipe names are visible
5. [ ] Check if thumbnails/images display
6. [ ] Scroll through list if multiple recipes

**Expected Results:**
- All recipes visible in list
- Recipe cards properly formatted
- Text is readable
- No overlapping UI elements
- Scrolling is smooth if list is long

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 2.3 View Recipe Details
**Objective:** Test recipe detail screen

**Steps:**
1. [ ] Click on any recipe in list
2. [ ] View recipe detail screen
3. [ ] Check all information displays
4. [ ] Scroll through all sections
5. [ ] Go back to recipe list

**Expected Results:**
- Detail screen loads without lag
- All recipe information visible
- Images/thumbnails display if present
- Back button returns to list
- No missing information

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 2.4 Edit Recipe
**Objective:** Test recipe modification

**Steps:**
1. [ ] Open recipe detail screen
2. [ ] Click "Edit" button
3. [ ] Modify recipe name to "Updated Recipe Name"
4. [ ] Change difficulty to "Hard"
5. [ ] Save changes
6. [ ] View recipe details again

**Expected Results:**
- Edit screen opens
- All fields editable
- Changes save successfully
- Updated information displays in detail view
- Other recipes unaffected

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 2.5 Delete Recipe
**Objective:** Test recipe deletion

**Steps:**
1. [ ] Find recipe in list
2. [ ] Look for delete option (swipe/long-press/button)
3. [ ] Select delete
4. [ ] Confirm deletion if prompted
5. [ ] Verify recipe removed from list

**Expected Results:**
- Delete option accessible
- Confirmation dialog appears
- Recipe removed after confirmation
- List updated immediately
- Other recipes remain unaffected

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 2.6 Search Recipes
**Objective:** Test search functionality

**Test Case 1 - Basic Search:**
1. [ ] Look for search bar/icon
2. [ ] Click search
3. [ ] Type "pasta"
4. [ ] View search results

**Expected Results:**
- Search bar accessible
- Can type search terms
- Results filter correctly
- Results update in real-time
- Relevant recipes display

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - Empty Search:**
1. [ ] Open search
2. [ ] Clear search term
3. [ ] View results

**Expected Results:**
- Returns all recipes
- No error messages
- List displays completely

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 2.7 Filter Recipes
**Objective:** Test recipe filtering

**Test Case 1 - Filter by Cuisine:**
1. [ ] Open filter options
2. [ ] Select "Italian" cuisine
3. [ ] Apply filter
4. [ ] Verify only Italian recipes show

**Expected Results:**
- Filter options accessible
- Selection works
- Filter applied correctly
- Only matching recipes display
- Can clear filter

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - Filter by Difficulty:**
1. [ ] Select "Easy" difficulty filter
2. [ ] Apply filter
3. [ ] Verify only easy recipes show

**Expected Results:**
- Correct recipes displayed
- Filter working as expected
- Can combine multiple filters
- Clear filter option available

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 3: Recipe Link Extraction Feature

### 3.1 Open Extraction Modal
**Objective:** Verify extraction UI opens correctly

**Steps:**
1. [ ] On Add Recipe screen, look for "Extract from Link" button
2. [ ] Click the button
3. [ ] Observe modal/dialog opening
4. [ ] Check all UI elements present

**Expected Results:**
- Modal/dialog opens without lag
- UI clearly displays
- Close button visible
- Input field visible
- Submit button visible

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.2 Extract from YouTube
**Objective:** Test recipe extraction from YouTube

**Steps:**
1. [ ] Open extraction modal
2. [ ] Copy YouTube recipe video URL (or use: https://www.youtube.com/watch?v=example)
3. [ ] Paste URL in input field
4. [ ] Click "Extract" or "Submit"
5. [ ] Wait for extraction (may take 5-10 seconds)
6. [ ] View preview results

**Expected Results:**
- URL field accepts input
- Extraction button clickable
- Loading indicator appears during extraction
- Preview displays extracted data
- Shows recipe name, ingredients, instructions
- Can confirm/save extraction
- No crashes during extraction

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.3 Extract from TikTok
**Objective:** Test TikTok recipe extraction

**Steps:**
1. [ ] Open extraction modal
2. [ ] Enter TikTok recipe video URL
3. [ ] Click "Extract"
4. [ ] Wait for processing
5. [ ] Review preview

**Expected Results:**
- Successfully extracts TikTok videos
- Preview shows correct data
- No errors with TikTok URLs

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.4 Extract from Instagram
**Objective:** Test Instagram recipe extraction

**Steps:**
1. [ ] Open extraction modal
2. [ ] Enter Instagram recipe post URL
3. [ ] Click "Extract"
4. [ ] Wait for processing
5. [ ] Review preview

**Expected Results:**
- Successfully extracts Instagram posts
- Preview shows correct data
- Handles both video and carousel posts

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.5 Extract from Blog
**Objective:** Test blog recipe extraction

**Steps:**
1. [ ] Open extraction modal
2. [ ] Enter recipe blog URL
3. [ ] Click "Extract"
4. [ ] Wait for processing
5. [ ] Review preview

**Expected Results:**
- Successfully extracts blog recipes
- Identifies recipe content correctly
- Separates ingredients from instructions

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.6 Invalid URL Handling
**Objective:** Test error handling for invalid URLs

**Test Case 1 - Malformed URL:**
1. [ ] Open extraction modal
2. [ ] Enter: "not a valid url"
3. [ ] Click "Extract"

**Expected Results:**
- Error message displays
- User-friendly error message
- No crash occurs
- Can retry with valid URL

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - Non-Recipe URL:**
1. [ ] Enter URL to non-recipe page: "https://www.google.com"
2. [ ] Click "Extract"

**Expected Results:**
- Shows appropriate error
- Indicates no recipe found
- Suggests trying different source

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.7 Network Error Handling
**Objective:** Test extraction with network issues

**Steps:**
1. [ ] Disable WiFi/mobile data
2. [ ] Try to extract from link
3. [ ] Observe error handling
4. [ ] Re-enable network
5. [ ] Try again

**Expected Results:**
- Shows network error message
- Doesn't crash app
- Can retry after network restored
- Graceful error handling

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 3.8 Save Extracted Recipe
**Objective:** Test saving extracted recipe to app

**Steps:**
1. [ ] Extract a recipe successfully
2. [ ] Review preview
3. [ ] Click "Save" or "Use Recipe"
4. [ ] Verify recipe added to list
5. [ ] View saved recipe details

**Expected Results:**
- Save button works
- Recipe added to recipe list
- All extracted data preserved
- Can view and edit saved recipe

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 4: Multi-Timer System

### 4.1 Add Timer
**Objective:** Test creating a new timer

**Test Case 1 - Quick Timer (5 minutes):**
1. [ ] Navigate to Timer section
2. [ ] Click "Add Timer"
3. [ ] Set time to 5 minutes
4. [ ] Click "Start"
5. [ ] Observe timer countdown

**Expected Results:**
- Timer screen loads
- Can set time easily
- Timer starts counting down
- Display updates every second
- No lag in countdown

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - Custom Duration:**
1. [ ] Add timer
2. [ ] Set custom time: 2 minutes 30 seconds
3. [ ] Start timer
4. [ ] Watch countdown

**Expected Results:**
- Can set custom durations
- Displays minutes and seconds correctly
- Countdown accurate

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 4.2 Multiple Timers
**Objective:** Test running multiple timers simultaneously

**Steps:**
1. [ ] Create first timer: 5 minutes
2. [ ] Start first timer
3. [ ] Create second timer: 3 minutes
4. [ ] Start second timer
5. [ ] Create third timer: 1 minute
6. [ ] Start third timer
7. [ ] Observe all timers counting down

**Expected Results:**
- Can create multiple timers
- All timers run simultaneously
- Each timer counts independently
- Displays all timers clearly
- No interference between timers

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 4.3 Timer Controls
**Objective:** Test pause, resume, and cancel functions

**Steps:**
1. [ ] Start a timer with 5 minutes
2. [ ] After 30 seconds, click "Pause"
3. [ ] Observe timer paused
4. [ ] Click "Resume"
5. [ ] Observe countdown continues
6. [ ] Click "Cancel"
7. [ ] Verify timer removed

**Expected Results:**
- Pause button stops countdown
- Resume continues from paused time
- Cancel removes timer
- Display updates correctly
- No time loss on pause/resume

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 4.4 Timer Completion
**Objective:** Test alarm and notification at timer end

**Steps:**
1. [ ] Create timer with 1 minute
2. [ ] Let it count down completely
3. [ ] Observe when timer reaches 0:00
4. [ ] Listen for alarm sound
5. [ ] Look for notification

**Expected Results:**
- Alarm sounds when timer completes
- Visual notification appears
- Clear "Done" or similar message
- Can dismiss notification
- App doesn't crash

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 4.5 Timer in Background
**Objective:** Test timer functionality when app is backgrounded

**Steps:**
1. [ ] Start timer with 2 minutes
2. [ ] Press home button (minimize app)
3. [ ] Wait 1 minute
4. [ ] Reopen app
5. [ ] Check timer time

**Expected Results:**
- Timer continues in background
- Time elapsed correctly
- Timer still running when app reopened
- Countdown continues accurately

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 4.6 Timer Persistence
**Objective:** Test if timers survive app restart

**Steps:**
1. [ ] Start timer with 5 minutes
2. [ ] Force close app (Settings > Apps > MyRecipeApp > Force Stop)
3. [ ] Reopen app immediately
4. [ ] Check if timer still exists/running

**Expected Results:**
- Timer persists after app restart
- Countdown continues accurately
- Or shows appropriate recovery message

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 5: Meal Planning

### 5.1 Access Meal Plan
**Objective:** Verify meal plan calendar opens correctly

**Steps:**
1. [ ] Navigate to "Meal Plan" section
2. [ ] Observe calendar display
3. [ ] Check current week display
4. [ ] Verify dates are correct

**Expected Results:**
- Meal plan screen loads
- Calendar displays clearly
- Current date highlighted
- Week view shows 7 days
- Navigation controls visible

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 5.2 Add Recipe to Meal Plan
**Objective:** Test adding recipes to specific dates

**Steps:**
1. [ ] Click on a date (e.g., Monday)
2. [ ] Select "Add Recipe" or similar
3. [ ] Choose recipe from list
4. [ ] Confirm addition
5. [ ] Verify recipe appears on calendar

**Expected Results:**
- Can select date easily
- Recipe list loads
- Can select recipe
- Recipe added to meal plan
- Visible on calendar immediately

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 5.3 View Daily Meal Plan
**Objective:** Test viewing recipes for a specific day

**Steps:**
1. [ ] Click on date with recipes
2. [ ] View recipes planned for that day
3. [ ] Check all recipes display
4. [ ] Verify recipe details visible

**Expected Results:**
- Daily view shows all recipes
- Recipe names clear
- Can view recipe details
- Can remove recipes
- Layout is organized

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 5.4 Edit Meal Plan
**Objective:** Test modifying meal plans

**Steps:**
1. [ ] Find date with recipe
2. [ ] Look for edit option
3. [ ] Replace recipe with different one
4. [ ] Remove a recipe from plan
5. [ ] Verify changes saved

**Expected Results:**
- Edit options accessible
- Can change recipes
- Can remove recipes
- Changes save automatically
- Calendar updates

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 5.5 Navigate Between Weeks
**Objective:** Test calendar navigation

**Steps:**
1. [ ] Look for week navigation controls
2. [ ] Click "Next Week" or similar
3. [ ] Verify calendar shows next week
4. [ ] Click "Previous Week"
5. [ ] Return to current week

**Expected Results:**
- Navigation buttons work smoothly
- Calendar updates correctly
- Dates shown properly
- No jumps or skipped weeks
- Current week easily identifiable

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 5.6 Meal Plan Persistence
**Objective:** Test if meal plans save across sessions

**Steps:**
1. [ ] Add recipe to Monday
2. [ ] Force close app
3. [ ] Reopen app
4. [ ] Navigate to meal plan
5. [ ] Check if recipe still on Monday

**Expected Results:**
- Meal plan data persists
- Recipes still visible after restart
- No data loss
- Dates remain correct

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 6: Shopping List Generator

### 6.1 Generate Shopping List
**Objective:** Test creating shopping list from meal plan

**Steps:**
1. [ ] Add recipes to meal plan for a week
2. [ ] Look for "Generate Shopping List"
3. [ ] Click to generate
4. [ ] Wait for list creation
5. [ ] View generated list

**Expected Results:**
- Can generate shopping list
- List shows all ingredients
- Quantities are correct
- Duplicates are combined
- List displays clearly

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 6.2 Mark Items as Purchased
**Objective:** Test checking off grocery items

**Steps:**
1. [ ] View shopping list
2. [ ] Click/check first item
3. [ ] Observe item marked as purchased
4. [ ] Continue with more items
5. [ ] Check multiple items

**Expected Results:**
- Can check items
- Checked items show visual indication (strikethrough, color change)
- Can uncheck items
- Multiple items can be checked
- Changes persist

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 6.3 Add Custom Items
**Objective:** Test adding items to shopping list

**Steps:**
1. [ ] Open shopping list
2. [ ] Look for "Add Item" button
3. [ ] Enter custom item: "Olive Oil"
4. [ ] Save item
5. [ ] Verify item appears in list

**Expected Results:**
- Can add custom items
- Items save to list
- Display correctly
- Can edit custom items
- Can delete custom items

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 6.4 Clear Completed Items
**Objective:** Test clearing purchased items

**Steps:**
1. [ ] Mark several items as purchased
2. [ ] Look for "Clear Completed" option
3. [ ] Click to clear
4. [ ] Verify completed items removed
5. [ ] Unpurchased items remain

**Expected Results:**
- "Clear Completed" button works
- Only purchased items removed
- Unpurchased items remain
- List shortens appropriately

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 6.5 Shopping List Persistence
**Objective:** Test if shopping list saves

**Steps:**
1. [ ] Create shopping list
2. [ ] Mark some items as purchased
3. [ ] Close app
4. [ ] Reopen app
5. [ ] Check shopping list

**Expected Results:**
- Shopping list data persists
- Checked items remain checked
- All items still in list
- Modifications preserved

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 7: User Feedback System

### 7.1 Access Feedback Form
**Objective:** Verify feedback form is accessible

**Steps:**
1. [ ] Navigate to app settings/menu
2. [ ] Look for "Feedback" option
3. [ ] Click to open feedback form
4. [ ] Observe form layout

**Expected Results:**
- Feedback option easily found
- Form loads without errors
- Text input field visible
- Submit button visible
- Clear instructions provided

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 7.2 Submit Feedback
**Objective:** Test submitting feedback

**Steps:**
1. [ ] Open feedback form
2. [ ] Enter test feedback: "Great app! Love the timer feature."
3. [ ] Click "Submit"
4. [ ] Observe submission confirmation
5. [ ] Check if form clears

**Expected Results:**
- Can type feedback
- Submit button works
- Confirmation message displays
- Form clears for new feedback
- No crashes during submission

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 7.3 Feedback Validation
**Objective:** Test form validation

**Test Case 1 - Empty Feedback:**
1. [ ] Leave feedback field empty
2. [ ] Click "Submit"

**Expected Results:**
- Shows validation error
- Prevents empty submission
- User-friendly error message

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - Very Long Feedback:**
1. [ ] Enter very long feedback (> 1000 characters)
2. [ ] Submit

**Expected Results:**
- Accepts long feedback
- No truncation of data
- Submits successfully

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 8: UI/UX & Navigation

### 8.1 Overall UI Layout
**Objective:** Test UI consistency and appearance

**Steps:**
1. [ ] Navigate through all screens
2. [ ] Check text readability
3. [ ] Verify button clarity
4. [ ] Look for UI inconsistencies
5. [ ] Check color scheme consistency

**Expected Results:**
- Consistent layout across screens
- Text clearly readable
- Buttons obvious and clickable
- No broken UI elements
- Professional appearance
- Consistent color scheme
- Proper spacing and alignment

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 8.2 Navigation Responsiveness
**Objective:** Test navigation speed and fluidity

**Steps:**
1. [ ] Navigate between screens rapidly
2. [ ] Try quick tap sequences
3. [ ] Observe for lag or freezing
4. [ ] Return to main screen

**Expected Results:**
- Smooth navigation transitions
- No lag between screens
- Responsive to user input
- No freezing or stalling
- Fast transitions

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 8.3 Back Button Functionality
**Objective:** Test back navigation

**Steps:**
1. [ ] Navigate to various screens
2. [ ] Press Android back button
3. [ ] Verify correct navigation back
4. [ ] Try from different screens
5. [ ] Check from deepest screens

**Expected Results:**
- Back button works consistently
- Returns to previous screen
- Works from all screens
- Doesn't skip screens
- App doesn't close unexpectedly

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 8.4 Screen Orientation
**Objective:** Test app behavior on orientation change

**Steps:**
1. [ ] Open app in portrait mode
2. [ ] Rotate device to landscape
3. [ ] Observe screen adjustment
4. [ ] Check UI elements position
5. [ ] Rotate back to portrait

**Expected Results:**
- App rotates smoothly
- UI elements reposition correctly
- Text remains readable
- No data loss on rotation
- Features still accessible

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 9: Performance & Stability

### 9.1 App Launch Time
**Objective:** Measure time to launch

**Steps:**
1. [ ] Close app completely
2. [ ] Check device time
3. [ ] Tap app icon
4. [ ] Record time when main screen fully loaded
5. [ ] Calculate total time

**Expected Results:**
- Launch time < 3 seconds (ideal)
- Launch time < 5 seconds (acceptable)
- No delays or stalls
- Immediate responsiveness

**Actual Launch Time:** _________ seconds

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 9.2 Memory Usage
**Objective:** Monitor memory consumption

**Steps:**
1. [ ] Open Developer Options on device
2. [ ] Navigate to Memory stats
3. [ ] Open MyRecipeApp
4. [ ] Note initial memory (Settings > Apps > MyRecipeApp > Storage)
5. [ ] Add 10 recipes
6. [ ] Check memory again
7. [ ] Force close app
8. [ ] Reopen and check memory

**Expected Results:**
- Initial: < 150MB
- With 10 recipes: < 250MB
- No excessive growth
- No memory leaks after restart
- Stable memory usage

**Actual Memory Usage:**
- Initial: _________ MB
- After recipes: _________ MB
- After restart: _________ MB

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 9.3 No Crashes During Normal Use
**Objective:** Test stability during typical usage

**Steps:**
1. [ ] Use app for 15+ minutes
2. [ ] Perform various operations:
   - Add recipes
   - Create timers
   - View meal plan
   - Generate shopping list
   - Extract recipes
3. [ ] Monitor for crashes

**Expected Results:**
- No crashes occur
- App remains responsive
- All features work smoothly
- Can return to any feature
- Stable throughout testing

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Number of Crashes:** _______

**Notes:** _________________________________

### 9.4 Error Recovery
**Objective:** Test app recovery from errors

**Steps:**
1. [ ] Try operations that might fail:
   - Extract invalid URL
   - Create timer with invalid input
   - Add recipe with missing fields
2. [ ] Observe error messages
3. [ ] Try to continue using app

**Expected Results:**
- Error messages clear and helpful
- App doesn't crash on errors
- Can continue using app
- Can retry failed operations
- Graceful error handling

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 10: Data Persistence & Storage

### 10.1 Recipe Data Persistence
**Objective:** Verify recipes save correctly

**Steps:**
1. [ ] Add 5 recipes
2. [ ] Close app
3. [ ] Reopen app
4. [ ] Check recipe list

**Expected Results:**
- All recipes still present
- Data unchanged
- Correct information
- No data corruption
- List order preserved

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 10.2 Meal Plan Persistence
**Objective:** Verify meal plans save correctly

**Steps:**
1. [ ] Create week-long meal plan
2. [ ] Force close app
3. [ ] Reopen and check meal plan
4. [ ] Verify all recipes present

**Expected Results:**
- Meal plan data persists
- All recipes intact
- Dates correct
- No data loss
- Can continue editing

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 10.3 Shopping List Persistence
**Objective:** Verify shopping list saves

**Steps:**
1. [ ] Generate shopping list
2. [ ] Mark items as purchased
3. [ ] Add custom items
4. [ ] Close app
5. [ ] Reopen and check list

**Expected Results:**
- All items persist
- Checked status preserved
- Custom items remain
- No data loss
- List intact

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 10.4 Storage Space Usage
**Objective:** Monitor app storage usage

**Steps:**
1. [ ] Settings > Apps > MyRecipeApp
2. [ ] Check app storage/cache
3. [ ] Add recipes and data
4. [ ] Check storage again
5. [ ] Verify reasonable usage

**Expected Results:**
- App storage < 100MB for typical use
- Reasonable cache size
- No bloated data
- Efficient storage usage
- Clear cache option available

**Storage Usage:**
- Initial: _________ MB
- After use: _________ MB

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 11: Permissions & Privacy

### 11.1 Permission Requests
**Objective:** Verify appropriate permission requests

**Steps:**
1. [ ] Review what permissions app requests
2. [ ] Check Settings > Apps > MyRecipeApp > Permissions
3. [ ] Try features requiring permissions
4. [ ] Grant and deny permissions

**Expected Results:**
- Only necessary permissions requested
- Clear permission explanations
- Can deny non-critical permissions
- App functions with minimal permissions
- No surprise permission requests

**Permissions Found:**
1. ____________________
2. ____________________
3. ____________________

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 11.2 Privacy Policy Access
**Objective:** Verify privacy policy is accessible

**Steps:**
1. [ ] Look for "Privacy Policy" link
2. [ ] Try to access it
3. [ ] Verify document opens
4. [ ] Check content readability
5. [ ] Verify URL is HTTPS

**Expected Results:**
- Privacy policy easily accessible
- Content clear and readable
- HTTPS URL (secure)
- Comprehensive coverage
- Easy to return to app

**Privacy Policy URL:** _____________________

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 11.3 Data Collection Disclosure
**Objective:** Verify data collection is disclosed

**Steps:**
1. [ ] Review privacy policy
2. [ ] Check what data is collected
3. [ ] Verify user-friendly explanations
4. [ ] Check data usage justification

**Expected Results:**
- Clear explanation of collected data
- Purpose of each data collection
- User control over data
- No surprise data collection
- Compliant with regulations

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 12: Network & Connectivity

### 12.1 WiFi Connectivity
**Objective:** Test app with WiFi enabled

**Steps:**
1. [ ] Enable WiFi
2. [ ] Connect to network
3. [ ] Use all features requiring network
4. [ ] Extract recipes
5. [ ] Verify smooth operation

**Expected Results:**
- All features work smoothly
- Network calls succeed
- No connection errors
- Responsive to user input
- Data loads quickly

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 12.2 Mobile Data
**Objective:** Test with mobile data

**Steps:**
1. [ ] Disable WiFi
2. [ ] Enable mobile data
3. [ ] Use features requiring network
4. [ ] Extract recipes using 4G/5G
5. [ ] Monitor operation

**Expected Results:**
- Works with mobile data
- No crashes on network change
- Responsive over cellular
- Graceful handling of slow connections

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 12.3 Network Disconnection
**Objective:** Test offline scenarios

**Steps:**
1. [ ] Enable airplane mode (offline)
2. [ ] Try to extract recipe
3. [ ] Observe error handling
4. [ ] Disable airplane mode
5. [ ] Try again

**Expected Results:**
- Clear offline message
- App doesn't crash
- Offline features still work
- Reconnection works smoothly
- Can retry after connection

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Test Category 13: Edge Cases & Error Handling

### 13.1 Empty States
**Objective:** Test behavior with empty data

**Test Case 1 - No Recipes:**
1. [ ] Uninstall and reinstall app
2. [ ] Check recipe list (should be empty)
3. [ ] Observe empty state display

**Expected Results:**
- Displays "No recipes" message
- Not confusing for user
- Shows call to action (e.g., "Add Recipe")
- Graceful empty state handling

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

**Test Case 2 - No Meal Plan:**
1. [ ] Check meal plan with no recipes
2. [ ] Observe display

**Expected Results:**
- Shows helpful message
- Suggests adding recipes
- No confusing empty display

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 13.2 Large Data Sets
**Objective:** Test with many recipes

**Steps:**
1. [ ] Add 50+ recipes
2. [ ] Check list performance
3. [ ] Search functionality
4. [ ] Meal planning with many recipes
5. [ ] Monitor memory

**Expected Results:**
- List scrolls smoothly
- No lag with large dataset
- Search still fast
- App remains responsive
- Memory stable

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 13.3 Special Characters
**Objective:** Test with various characters

**Steps:**
1. [ ] Add recipe with: "Café au Lait & Crème Brûlée"
2. [ ] Use emojis if applicable: "🍝 Pasta"
3. [ ] Use numbers: "5-Star Recipe"
4. [ ] Use symbols: "$15 Budget Meals"
5. [ ] Save and verify display

**Expected Results:**
- All characters display correctly
- No encoding errors
- Proper text rendering
- Data integrity maintained

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

### 13.4 Concurrent Operations
**Objective:** Test simultaneous operations

**Steps:**
1. [ ] Start timer
2. [ ] While timer running, add recipe
3. [ ] While both active, create meal plan
4. [ ] Observe app behavior

**Expected Results:**
- No conflicts
- All operations complete
- App stable
- No data corruption
- Proper resource management

**Actual Results:**
- ⭕ Pass | ⭕ Fail | ⭕ Skipped

**Notes:** _________________________________

---

## Summary & Results

### Test Execution Summary

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 101 |
| **Passed** | ____ |
| **Failed** | ____ |
| **Skipped** | ____ |
| **Pass Rate** | __% |
| **Total Time (hours)** | __:__ |

### Issues Summary

#### Critical Issues (Block Release)
**Count:** ____

| # | Issue | Component | Severity | Fix Required |
|---|-------|-----------|----------|--------------|
| 1 | ____________ | __________ | Critical | Before submit |
| 2 | ____________ | __________ | Critical | Before submit |

#### High Priority Issues
**Count:** ____

| # | Issue | Component | Severity | Fix Required |
|---|-------|-----------|----------|--------------|
| 1 | ____________ | __________ | High | Before submit |
| 2 | ____________ | __________ | High | Before submit |

#### Medium Priority Issues
**Count:** ____

| # | Issue | Component | Severity | Fix Required |
|---|-------|-----------|----------|--------------|
| 1 | ____________ | __________ | Medium | If time |
| 2 | ____________ | __________ | Medium | If time |

#### Low Priority Issues
**Count:** ____

| # | Issue | Component | Severity | Fix Required |
|---|-------|-----------|----------|--------------|
| 1 | ____________ | __________ | Low | Optional |
| 2 | ____________ | __________ | Low | Optional |

### Recommendations

**Overall Assessment:**
- [ ] ✅ APPROVED FOR SUBMISSION - All tests pass, no critical issues
- [ ] ⚠️  CONDITIONAL APPROVAL - Minor issues found, non-blocking
- [ ] ❌ NOT APPROVED - Critical or high issues found, must fix before submit
- [ ] 🔄 NEEDS RETEST - Issues fixed, retest required

**Immediate Actions Required:**
1. _________________________________
2. _________________________________
3. _________________________________

**Before Final Submission:**
- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Screenshots prepared
- [ ] Release notes finalized
- [ ] Content rating confirmed
- [ ] Privacy policy verified
- [ ] APK signed correctly

---

## Tester Sign-Off

**Tester Name:** ________________________  
**Date:** ____/____/____  
**Time:** __:__  
**Signature/Approval:** ________________________

**QA Manager Review (if applicable):**  
**Manager Name:** ________________________  
**Date:** ____/____/____  
**Approval:** ⭕ Approved | ⭕ Rejected | ⭕ Conditional

---

**Document Version:** 1.0  
**Last Updated:** December 21, 2025  
**Related Issue:** #52 - Google Play Store Submission
