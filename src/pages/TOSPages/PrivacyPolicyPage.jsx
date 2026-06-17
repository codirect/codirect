import { useNavigate } from 'react-router-dom';
import './TOSPages.css';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  return (
    <div className="policy-container">
      <button onClick={() => navigate('/projects')}>Back</button>
      <h1>Privacy Policy</h1>
      <p>coDIRECT does not collect, store, or transmit any of your personal user data.</p>
      <p>The application utilizes a server to facilitate a websocket bridge between coDIRECT and Bitfocus Companion. While this bridge is necessary for communication, it does not record, store, or access your configurations, local files, or personal information.</p>
    </div>
  );
}