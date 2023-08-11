let debugMode = true;

export function logDebug(...data) {
    if (debugMode) {
        console.log(...data);
    }
}

export function setDebugMode(mode) {
    debugMode = mode;
}

export function logEvent(event, callback = undefined) {
    console.log("Event:", event);
    if (
        window.sa_event &&
        import.meta.env.NODE_ENV === "production" &&
        import.meta.env.VITE_SA_DOMAIN !== undefined
    ) {
        window.sa_event(event, callback);
    } else if (callback !== undefined) {
        callback();
    }
}
