# End-to-End Test Flow: Creating a Test Shipment with Supabase Integration

## Overview
This test validates that the complete Supabase integration works correctly by creating a shipment through the admin form and verifying it persists in the database and appears in real-time across all pages.

## Prerequisites
✅ Dev server running on `http://localhost:5173`
✅ Supabase project configured with credentials in `.env.local`
✅ Database tables created (users, shipments, checkpoints)

---

## Test Steps

### Step 1: Access Admin Form
1. Open browser → `http://localhost:5173`
2. Navigate to Admin Dashboard (click "Admin" in navbar or `/admin` route)
3. Click **"Add New Shipment"** button
4. Verify form loads with empty fields

**Expected:** Form displays with all required fields

---

### Step 2: Fill in Sender Information

| Field | Test Value |
|-------|-----------|
| Sender Name | John Smith |
| Sender Phone | +1-555-0101 |
| Receiver Name | Alice Johnson |
| Receiver Phone | +1-555-0102 |
| Receiver Email | alice@example.com |
| Delivery Address | 123 Main St, New York, NY 10001 |
| Warehouse | New York Hub |
| Transportation | Air Freight |
| Package Name | Electronics Shipment |

**Expected:** All fields fill without errors

---

### Step 3: Add Shipment Details

| Field | Test Value |
|-------|-----------|
| Cost | 250.00 |
| Paid | ✓ (checked) |
| Vehicles Count | 2 |
| Vehicle Type | Boeing 747 Freighter |
| Driver Name | Captain James Wilson |
| Driver Experience | 10+ years |

**Expected:** All optional fields fill successfully

---

### Step 4: Add 10 Checkpoints (Required: 10-12)

Enter these checkpoint locations in order:

1. **Checkpoint 1:** New York Hub - Origin
2. **Checkpoint 2:** Newark International Airport
3. **Checkpoint 3:** Air Traffic Control - Departure
4. **Checkpoint 4:** Atlantic Ocean Airspace - En Route
5. **Checkpoint 5:** Shannon Airport (Ireland) - Refuel Stop
6. **Checkpoint 6:** European Airspace - En Route
7. **Checkpoint 7:** Amsterdam Schiphol - Layover
8. **Checkpoint 8:** Liege Airport - Cargo Hub
9. **Checkpoint 9:** Brussels Final Approach
10. **Checkpoint 10:** Brussels Airport - Destination
11. **Checkpoint 11:** Customs & Clearance
12. **Checkpoint 12:** Final Delivery - Destination (Optional)

**Expected:** All 10+ checkpoints fill without validation errors

---

### Step 5: Set Countdown Timer

| Field | Test Value |
|-------|-----------|
| Countdown Duration | 48 (hours) |

**Expected:** Timer field accepts numeric value representing hours

---

### Step 6: Submit Form

1. Click **"Create Shipment"** button
2. Watch for "Shipment created" success message
3. Note the **Tracking ID** displayed in success alert
4. **Copy Tracking ID** to clipboard for next steps

**Expected:** 
- ✅ Form submits without errors
- ✅ Success message displays with Tracking ID
- ✅ Redirect to admin dashboard or show confirmation

---

### Step 7: Verify in Admin Dashboard

1. Navigate to Admin Dashboard (`/admin`)
2. Look for newly created shipment in the list
3. Verify shipment shows:
   - Package Name: "Electronics Shipment"
   - Status: "In Transit" (not paused/stopped)
   - Progress bar with 10+ segments (one per checkpoint)

**Expected:**
- ✅ Shipment appears in admin list immediately (real-time update)
- ✅ All shipment details match what was entered
- ✅ Progress bar displays with correct number of checkpoints

---

### Step 8: Test Admin Detail View

1. Click **"View"** button on the created shipment
2. Verify full shipment details page loads:
   - All sender/receiver information correct
   - Transportation type: "Air Freight"
   - Countdown timer duration displayed (48 hours)
   - All 10 checkpoints visible in progress bar
   - Control buttons visible: Play/Pause, Stop

**Expected:**
- ✅ Detail page shows all correct information
- ✅ No console errors
- ✅ Pause/Stop buttons are interactive

---

### Step 9: Test Pause Functionality

1. On shipment detail page, click **"Pause"** button
2. Verify button text changes to **"Play"**
3. Verify shipment status changes to "Paused"

**Expected:**
- ✅ Button toggles immediately
- ✅ Status bar shows "Paused" badge
- ✅ Data saved to Supabase (can refresh and verify persistence)

---

### Step 10: Test Resume Functionality

1. Click **"Play"** button to resume
2. Verify button text changes back to **"Pause"**
3. Verify status returns to "In Transit"

**Expected:**
- ✅ Shipment resumes with correct time adjustment
- ✅ Countdown timer continues from where it paused
- ✅ Progress updates in real-time (updates every 1 second)

---

### Step 11: Test Tracking Page

1. Navigate to home page (`/`)
2. Find the "Track Your Shipment" section
3. Paste the **Tracking ID** from Step 6
4. Click **"Track"** button

**Expected:**
- ✅ Shipment data loads from Supabase
- ✅ All shipment details display correctly
- ✅ Progress bar shows current position
- ✅ Countdown timer displays time remaining
- ✅ Status shows "In Transit"

---

### Step 12: Test Real-Time Countdown Updates

1. Stay on tracking page for 5 seconds
2. Observe countdown timer value in real-time
3. Verify time decreases every second (e.g., "47h 59m 55s remaining" → "47h 59m 54s remaining")

**Expected:**
- ✅ Timer updates automatically without page refresh
- ✅ Updates occur every 1 second smoothly
- ✅ No console errors

---

### Step 13: Test Stop Functionality

1. Return to Admin Detail page
2. Click **"Stop"** button
3. Modal dialog appears asking for stop reason
4. Enter reason: "Weather delay - rerouting cargo"
5. Click **"Stop"** in modal

**Expected:**
- ✅ Modal appears with input field
- ✅ Reason is fully submitted
- ✅ Status changes to "Stopped"
- ✅ Stop reason displays persistently

---

### Step 14: Test Resume After Stop

1. On detail page, click **"Resume"** button
2. Verify shipment returns to "In Transit"
3. Verify stop reason is cleared

**Expected:**
- ✅ Shipment resumes active status
- ✅ All timers are properly reset
- ✅ Progress bar remains at same checkpoint

---

### Step 15: Test Deletion

1. Go back to Admin Dashboard
2. Find the test shipment
3. Click **"Delete"** button
4. Verify shipment is removed from list

**Expected:**
- ✅ Shipment immediately removed from dashboard
- ✅ Real-time deletion (no page refresh needed)
- ✅ Attempting to track deleted shipment shows "Not Found"

---

### Step 16: Verify Supabase Persistence

1. Open Supabase dashboard in separate tab
2. Go to **Table Editor** → **shipments** table
3. Verify test shipment exists with all data:
   - sender_name: "John Smith"
   - receiver_name: "Alice Johnson"
   - countdown_duration: 172800 (seconds = 48 hours)
   - status: "in_transit" or "stopped" (depending on last action)

**Expected:**
- ✅ Shipment data persists in database
- ✅ All fields match what was entered
- ✅ Timestamps are correct

---

## Success Criteria

✅ **All 16 test steps complete without errors**
✅ **Supabase database contains test shipment**
✅ **Real-time updates work across all pages**
✅ **Countdown timer updates every second**
✅ **Pause/Resume/Stop functions work correctly**
✅ **Tracking page displays live data (including product images, route/driver photos)**
✅ **No console errors throughout test**

---

## Troubleshooting

### Issue: Form submission fails
**Solution:** Check browser console (F12) for error messages. Verify `.env.local` has correct Supabase credentials.

### Issue: Shipment doesn't appear in dashboard
**Solution:** Refresh the page (Ctrl+R). Check if real-time subscription is active. Look in browser Network tab for API calls to Supabase.

### Issue: Countdown timer doesn't update
**Solution:** Verify browser console shows no errors. Check that shipment is not paused. Ensure `countdown_duration` and `countdown_start_time` are set.

### Issue: Images don't upload
**Solution:** Currently images are uploaded to Supabase Storage. If upload fails, check Storage bucket permissions in Supabase dashboard.

---

## Notes

- **Timestamps:** All timestamps are stored in ISO 8601 format in UTC
- **Duration:** Countdown duration is stored in **seconds** in the database but displayed in **hours** in the UI
- **Currency:** Cost is stored as a numeric value (no currency symbol in DB)
- **Images:** Stored in Supabase Storage buckets, with URLs persisted in the shipments table; both admin detail and tracking pages should render them

---

## Next Steps After Test

1. ✅ If all tests pass → Ready for authentication setup
2. ✅ If all tests pass → Ready for production deployment  
3. ❌ If tests fail → Debug issues in AdminContext, shipmentService, or Supabase connection

---

**Test Date:** February 14, 2026
**Tester:** (Will be filled in after manual test)
**Result:** PENDING
