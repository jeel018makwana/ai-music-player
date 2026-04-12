import React, { useState } from "react";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => {
        setShowPassword(prev => !prev);
    };
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("https://ai-music-player-3zcp.onrender.com/login", {
                method:"POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email, password})
            });

            const data = await res.json();

            if (res.status === 200) {
                localStorage.setItem("token", data.token);

                alert("Login Successful");
                navigate("/dashboard");
            } else {
                alert(data.msg);
            }
        } catch (error) {
            console.log(error);
            alert("Server error");
        }
    };
    return (
        <div className="login-container">
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>
            <div className="login-card">
                <h2>Welcome Back</h2>
                <p className="subtitle">Login to your music world</p>

                <form onSubmit={handleLogin}>
                    <input 
                        type="email"
                        placeholder="Enter your email"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span 
                            className="eye-btn"
                            onClick={togglePassword}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </span>
                    </div>
                    <button className="login-btn">Login</button>
                </form>

                <p className="signup-text">
                    Don't have an account?{" "}
                    <Link to="/signup" className="signup-link">
                        Signup
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login;