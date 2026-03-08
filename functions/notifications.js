const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

exports.notifyAdmin = onDocumentCreated(
  {
    document: "rooms/{roomId}/students/{studentUid}/reports/{reportId}",
    region: "africa-south1"
  },
  async (event) => {
    const report = event.data?.data() || {};
    logger.info("Notification stub: new fault report", {
      room: report.room || event.params.roomId,
      studentUid: event.params.studentUid
    });
  }
);
