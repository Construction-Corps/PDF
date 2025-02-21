import { Modal, Card } from 'antd';
import React, { useEffect, useState } from 'react';
import { fetchJobTread } from '../../../utils/JobTreadApi';

const ActivityModal = ({ jobId, open, onClose, job }) => {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState(job?.comments?.nodes || []);

//   useEffect(() => {
//     if (open) {
//       loadComments();
//     }
//   }, [open, jobId]);

//   const loadComments = async () => {
//     setLoading(true);
//     try {
//       const query = {
//         "job": {
//           "$": { "id": jobId },
//           "id": {},
//           "comments": {
//             "nodes": {
//               "comments": {},
//               "id": {},
//               "message": {},
//               "name": {},
//               "dailyLog": {},
//               "createdAt": {},
//               "createdByUser": {}
//             }
//           }
//         }
//       };

//       const response = await fetchJobTread(query);
//       setComments(response.job.comments.nodes);
//     } catch (error) {
//       console.error("Error loading comments:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

  return (
    <Modal
      title="Activity"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <Card key={comment.id} className="comment">
              <div className="comment-header">
                {comment.name && <strong className="mr-2">{comment.name}</strong>}
                <span className="mr-2">{new Date(comment.createdAt).toLocaleDateString()}</span>
                <span className="mr-2 italic">{comment.createdByUser.name}</span>
              </div>

              
              <div className="comment-message">{comment.message}</div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ActivityModal;
