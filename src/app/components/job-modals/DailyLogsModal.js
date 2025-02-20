import { Modal, Card } from 'antd';
import React, { useEffect, useState } from 'react';
import { fetchJobTread } from '../../../utils/JobTreadApi';

const DailyLogsModal = ({ jobId, open, onClose, job }) => {
  const [loading, setLoading] = useState(false);
  const [dailyLogs, setDailyLogs] = useState(job.dailyLogs.nodes || []);

//   useEffect(() => {
//     if (open) {
//       loadDailyLogs();
//     }
//   }, [open, jobId]);

//   const loadDailyLogs = async () => {
//     setLoading(true);
//     try {
//       const query = {
//         "job": {
//           "$": { "id": jobId },
//           "id": {},
//           "dailyLogs": {
//             "nodes": {
//               "id": {},
//               "notes": {},
//               "date": {}
//             }
//           }
//         }
//       };

//       const response = await fetchJobTread(query);
//       setDailyLogs(response.job.dailyLogs.nodes);
//     } catch (error) {
//       console.error("Error loading daily logs:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

  return (
    <Modal
      title="Daily Logs"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="daily-logs-list">
          {dailyLogs.map(log => (
            <Card key={log.id} className="daily-log">
              <div className="daily-log-header">
                <strong>{log.user.name}</strong>
                <span>{new Date(log.date).toLocaleDateString()}</span>
              </div>
              <div className="comment-message">{log.notes}</div>
            </Card>  
          ))}
        </div>
      )}
    </Modal>
  );
};

export default DailyLogsModal;
