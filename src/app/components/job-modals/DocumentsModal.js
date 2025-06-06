import { Card, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { fetchJobTread } from '../../../utils/JobTreadApi';
import { formatUSD } from '../../components/formatters/fields';

const DocumentsModal = ({ jobId, open, onClose, job}) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState(job.documents.nodes || []);

//   useEffect(() => {
//     if (open) {
//       loadDocuments();
//     }
//   }, [open, jobId]);

//   const loadDocuments = async () => {
//     setLoading(true);
//     try {
//       const query = {
//         "job": {
//           "$": { "id": jobId },
//           "id": {},
//           "documents": {
//             "nodes": {
//               "id": {},
//               "price": {},
//               "signedAt": {},
//                fullName 
//               "issueDate": {},
//               "amountPaid": {},
//               "balance": {},
//               "status": {}
//             }
//           }
//         }
//       };

//       const response = await fetchJobTread(query);
//       setDocuments(response.job.documents.nodes);
//     } catch (error) {
//       console.error("Error loading documents:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

  return (
    <Modal
      title="Documents"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="documents-list">
          {documents.map(doc => (
            <Card key={doc.id} className="document">
              <div className="document-header">
                <strong>Document: {doc.fullName}</strong>
              </div>
              <div className="document-details">
                <div>Status: {doc.status}</div>
                {/* <div>Price: {formatUSD(doc.price)}</div>
                <div>Balance: {formatUSD(doc.balance)}</div>
                <div>Amount Paid: {formatUSD(doc.amountPaid)}</div> */}
                {doc.issueDate && (
                  <div>Issued: {new Date(doc.issueDate).toLocaleDateString()}</div>
                )}
                {doc.signedAt && (
                  <div>Signed: {new Date(doc.signedAt).toLocaleDateString()}</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default DocumentsModal;
