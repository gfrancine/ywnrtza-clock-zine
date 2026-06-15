// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API#examples

// change button and status if wakelock becomes aquired or is released
// const changeUI = (status = 'acquired') => {
//   const acquired = status === 'acquired' ? true : false;
// }

let isSupported = false;

if ("wakeLock" in navigator) {
  isSupported = true;
} else {
  console.log("Wake lock is not supported by this browser.");
}

if (isSupported) {
  let wakeLock: WakeLockSentinel | null = null;

  // create an async function to request a wake lock
  const requestWakeLock = async () => {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      // change up our interface to reflect wake lock active
      // changeUI();

      // listen for our release event
      wakeLock.onrelease = function (ev) {
        console.log(ev);
      };
      // wakeLock.addEventListener('release', () => {
      // if wake lock is released alter the button accordingly
      // changeUI('released');
      // });
    } catch (err) {
      // if wake lock request fails - usually system related, such as battery
      console.error(err);
    }
  };

  const handleVisibilityChange = () => {
    if (wakeLock !== null && document.visibilityState === "visible") {
      requestWakeLock();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("click", requestWakeLock, { once: true });
  document.addEventListener("touchstart", requestWakeLock, { once: true });
}
