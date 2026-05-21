import { useState } from "react";

export default function AccountTab() {
  const [transactions] = useState([
    { id: 1, type: "Prize", amount: "000", status: "Pending", description: "Tournament X - 1st Place", date: "2024-01-15" },
    { id: 2, type: "Registration", amount: "000", status: "Completed", description: "Tournament X - 1st Place", date: "2024-01-10" },
    { id: 3, type: "Refund", amount: "000", status: "Completed", description: "Tournament Y - 1st Place", date: "2024-01-05" },
    { id: 4, type: "Prize", amount: "000", status: "Pending", description: "Tournament Z - 3rd Place", date: "2024-01-02" },
  ]);

  return (
    <div>
      <div className="text-center mb-4 pb-3 border-bottom">
        <p className="text-muted small text-uppercase mb-1">Account Balance</p>
        <h2 className="fw-bold display-4 text-primary">KES 0.00</h2>
      </div>

      <div className="text-start">
        <h5 className="fw-bold text-primary mb-3">Transactions</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="bg-light">
              <tr>
                <th className="small text-muted">Date</th>
                <th className="small text-muted">Type</th>
                <th className="small text-muted">Description</th>
                <th className="small text-muted text-end">Amount</th>
                <th className="small text-muted text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="small">{tx.date}</td>
                  <td>
                    <span className={`badge ${tx.type === 'Prize' ? 'bg-success' : tx.type === 'Registration' ? 'bg-info' : 'bg-secondary'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="small">{tx.description}</td>
                  <td className="text-end fw-bold">KES {tx.amount}</td>
                  <td className="text-center">
                    <span className={`badge ${tx.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-4 p-3 bg-light rounded">
          <small className="text-muted">This is a demo account. Real transactions will appear here after tournament participation.</small>
        </div>
      </div>
    </div>
  );
}