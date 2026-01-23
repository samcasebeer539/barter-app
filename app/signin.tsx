import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase_init";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailSignIn = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleEmailSignUp = async () => {
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError("");

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>Sign In</h2>

      <form onSubmit={handleEmailSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Sign In</button>
      </form>

      <button onClick={handleEmailSignUp}>
        Sign Up with Email
      </button>

      <hr />

      <button onClick={handleGoogleSignIn}>
        Continue with Google
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
