import React, { useState } from "react";
import "../styles/signup.css";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const handleSignup = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("https://ai-music-player-3zcp.onrender.com/signup", {
                method:"POST",
                headers: {
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({name, email, password})
            });

            const data = await res.json();

            if (res.status === 201) {
                alert("Signup Successfully!");
                navigate("/");
            } else {
                alert(data.msg);
            }
        } catch(error) {
            console.log(error);
            alert("Server error");
        }
    };

    return (
        <div className="signup-container">
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>
            <div className="signup-card">
                <h2>Create Account</h2>
                <p className="subtitle">Join your music world</p>

                <form onSubmit={handleSignup}>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        className="input-field"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
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
                            className="eye-btn material-icons" 
                            onClick={() => setShowPassword(!showPassword)} 
                            title={showPassword ? "Hide password": "Show password"}>
                        {showPassword ? "visibility_off" : "visibility"}</span>
                    </div>
                    <button className="signup-btn">Signup</button>
                </form>

                <p className="login-text">
                    Already have an account?{" "}
                    <Link to="/" className="login-link">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Signup;