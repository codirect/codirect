import { useNavigate } from 'react-router-dom';
import './TOSPages.css';

export default function TermsOfUse() {
  const navigate = useNavigate();
  return (
    <div className="policy-container">
      <button onClick={() => navigate('/projects')}>Back</button>
      <h1>Terms of Use</h1>
      <p>coDIRECT is provided "as is" without warranty of any kind.</p>
      <p>By using this software, you agree that the developer is not responsible for any issues arising from its use, including any impact on your hardware, software, or broadcast setups.</p>
      <p>This software is open-source. You are free to use, modify, and distribute it in accordance with the MIT license.</p>
    </div>
  );
}