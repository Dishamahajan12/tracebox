import { useNavigate } from "react-router-dom";
import "./App.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      <div className="content">
        <h1>
          Welcome to <span>Tracebox</span>
        </h1>

        <p className="description">
          Smart tracking. Better management. Seamless growth.
        </p>

        <div className="buttons">
          <button
            className="btn primary"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button className="btn secondary" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
