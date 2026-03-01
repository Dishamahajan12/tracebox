import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>TraceBox</h2>

        <div className="menu-item">Dashboard</div>
        <div className="menu-item">Profile</div>
        <div className="menu-item">Report</div>
        <div className="menu-item">Tickets</div>
        <div className="menu-item">My Progress</div>
        <div className="menu-item">Settings</div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="header">Dashboard Overview</div>

        <div className="cards">
          <div className="card">
            <h3>Total Tickets</h3>
            <p>24 Active Tickets</p>
          </div>

          <div className="card">
            <h3>Resolved</h3>
            <p>15 Completed</p>
          </div>

          <div className="card">
            <h3>Pending</h3>
            <p>9 Awaiting Fix</p>
          </div>

          <div className="card">
            <h3>My Progress</h3>
            <p>62% Completion</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;