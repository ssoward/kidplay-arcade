import React, { useState, useEffect } from 'react';
import API_CONFIG from '../config/api';

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

const ProductionTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: HealthResponse = await response.json();
        setHealthStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setHealthStatus(null);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        🧪 Production API Test
      </h3>
      
      <div className="space-y-2">
        <p><strong>API URL:</strong> {API_CONFIG.BASE_URL}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        
        {loading && (
          <div className="text-blue-600">
            ⏳ Testing connection...
          </div>
        )}
        
        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded">
            ❌ Connection Error: {error}
            <br />
            <small>Make sure the AWS security group allows port 3001</small>
          </div>
        )}
        
        {healthStatus && (
          <div className="text-green-600 bg-green-50 p-2 rounded">
            ✅ Connected Successfully!
            <br />
            Status: {healthStatus.status}
            <br />
            Message: {healthStatus.message}
            <br />
            Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionTest;
