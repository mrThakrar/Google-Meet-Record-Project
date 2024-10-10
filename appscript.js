function setupRescanTrigger() {
    // Check if the trigger already exists to avoid duplicates
    var triggers = ScriptApp.getProjectTriggers();
    var triggerExists = triggers.some(function(trigger) {
      return trigger.getHandlerFunction() === 'createEventTriggers';
    });
  
    if (!triggerExists) {
      // Create a time-based trigger that runs the scan every 60 minutes
      ScriptApp.newTrigger('createEventTriggers')
        .timeBased()
        .everyHours(1) // Rescans every hour
        .create();
    }
  }
  
  function createEventTriggers() {
    var calendar = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    var events = calendar.getEvents(now, oneHourLater);
  
    if (events.length === 0) {
      Logger.log("No events found in the next hour.");
      return;
    }
  
    events.forEach(function(event) {
      var startTime = event.getStartTime();
      var eventId = event.getId().split("@")[0];
      var calendarId = "primary";
  
      // Get the hangout link (Google Meet link)
      var eventSummary = event.getTitle();
      var hangoutLink = Calendar.Events.get(calendarId, eventId).hangoutLink;
      Logger.log("Event: " + eventSummary + ", link: " + hangoutLink);
  
      // Save the hangout link to Script Properties to retrieve it later
      var key = eventId; // Use eventId as the key for the link
      PropertiesService.getScriptProperties().setProperty(key, hangoutLink);
  
      // Create a time-based trigger to call the 'callAPI' function at the event's start time
      ScriptApp.newTrigger('callAPI')
        .timeBased()
        .at(startTime) // Trigger the function at the event's start time
        .create();
    });
  }
  
  function callAPI() {
    // This function will be triggered at the event start time
    // Fetch all events' hangout links from Script Properties
    var scriptProperties = PropertiesService.getScriptProperties();
  
    // For demonstration, let's say we loop through all properties (in a real case, handle specific events)
    var allKeys = scriptProperties.getKeys();
    allKeys.forEach(function(key) {
      var hangoutLink = scriptProperties.getProperty(key);
      Logger.log("hangoutLink11", hangoutLink )
  
      // Prepare the POST request payload
      // var payload = {
      //   "meetingLink": hangoutLink
      // };
  
      // Define your API endpoint URL here
      var apiUrl = "https://4xl5nx64-3000.inc1.devtunnels.ms/startRecording";
  
      // Options for the POST request
      var options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify({meetingId : hangoutLink})
      };
  
      // Make the POST request to your API
      try {
        var response = UrlFetchApp.fetch(apiUrl, options);
        Logger.log("API Response: " + response.getContentText());
      } catch (error) {
        Logger.log("Error sending request: " + error.toString());
      }
  
      // Optionally, delete the property after sending the API call
      scriptProperties.deleteProperty(key);
    });
  }
  
  // doGet function to handle web app requests
  function doGet(e) {
    setupRescanTrigger();
    
    // Returning a JSON response
    var result = {
      status: "success",
      message: "Triggers have been set for upcoming events."
    };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  