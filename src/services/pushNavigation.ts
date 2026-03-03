let openNotificationsHandler: (() => void) | null = null;
let hasPendingOpenRequest = false;

export const setOpenNotificationsHandler = (handler: (() => void) | null) => {
  openNotificationsHandler = handler;
  if (openNotificationsHandler && hasPendingOpenRequest) {
    hasPendingOpenRequest = false;
    openNotificationsHandler();
  }
};

export const openNotificationsScreen = () => {
  if (openNotificationsHandler) {
    openNotificationsHandler();
    return;
  }
  hasPendingOpenRequest = true;
};
