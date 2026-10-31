import { useEffect, useState } from "react";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import "./App.css";

const colleges = [
  {
    name: "College A",
    location: "Chennai",
    courses: ["Computer Science Engineering", "Information Technology"],
    cutoffs: { OC: 195, BC: 190, BCM: 187, MBC: 185, SC: 175, SCA: 170, ST: 165 },
  },
  {
    name: "College B",
    location: "Coimbatore",
    courses: ["Computer Science Engineering", "Information Technology", "Mechanical Engineering"],
    cutoffs: { OC: 190, BC: 185, BCM: 182, MBC: 180, SC: 170, SCA: 165, ST: 160 },
  },
  {
    name: "College C",
    location: "Madurai",
    courses: ["Electrical and Electronics Engineering", "Mechanical Engineering", "Civil Engineering"],
    cutoffs: { OC: 180, BC: 175, BCM: 172, MBC: 170, SC: 160, SCA: 155, ST: 150 },
  },
  {
    name: "College D",
    location: "Tiruchirappalli",
    courses: ["Computer Science Engineering", "Electrical and Electronics Engineering"],
    cutoffs: { OC: 185, BC: 180, BCM: 177, MBC: 175, SC: 165, SCA: 160, ST: 155 },
  },
];

const communities = [
  "OC",
  "BC",
  "BCM",
  "MBC",
  "SC",
  "SCA",
  "ST",
];

const courses = [
  "Computer Science Engineering",
  "Information Technology",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
];

export default function App() {
  const [step, setStep] = useState("welcome");
  const [name, setName] = useState(
    localStorage.getItem("studentName") || ""
  );
  const [email, setEmail] = useState(
    localStorage.getItem("emailForSignIn") || ""
  );
  const [user, setUser] = useState(auth.currentUser);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [marks, setMarks] = useState({
    mathematics: "",
    physics: "",
    chemistry: "",
  });

  const [cutoff, setCutoff] = useState(null);
  const [community, setCommunity] = useState("");
  const [course, setCourse] = useState("");
  const [selectedCollege, setSelectedCollege] = useState(null);

  // Restore the signed-in user and process a clicked email sign-in link.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setStep((currentStep) =>
          currentStep === "welcome" || currentStep === "email"
            ? "field"
            : currentStep
        );
      }
    });

    async function completeEmailSignIn() {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }

      let savedEmail = localStorage.getItem("emailForSignIn");

      if (!savedEmail) {
        savedEmail = window.prompt(
          "Please enter the email address where you received the sign-in link."
        );
      }

      if (!savedEmail) {
        setMessage("Please enter your email address to complete sign-in.");
        setStep("email");
        return;
      }

      try {
        setLoading(true);

        const result = await signInWithEmailLink(
          auth,
          savedEmail,
          window.location.href
        );

        localStorage.removeItem("emailForSignIn");

        const savedName = localStorage.getItem("studentName") || "";

        if (savedName && !result.user.displayName) {
          await updateProfile(result.user, {
            displayName: savedName,
          });
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        setUser(result.user);
        setStep("field");
        setMessage("Your email has been verified successfully!");
      } catch (error) {
        console.error(error);
        setMessage(
          "Sign-in failed. Please request a new email sign-in link."
        );
        setStep("email");
      } finally {
        setLoading(false);
      }
    }

    completeEmailSignIn();

    return unsubscribe;
  }, []);

  async function handleSendEmailLink(event) {
    event.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter your name first.");
      setStep("welcome");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      localStorage.setItem("studentName", name.trim());

      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(
        auth,
        email.trim(),
        actionCodeSettings
      );

      localStorage.setItem("emailForSignIn", email.trim());

      setMessage(
        "Sign-in link sent! Check your inbox and spam folder, then open the link on this device."
      );
    } catch (error) {
      console.error("Firebase email error:", error);

      setMessage(
       `Email error: ${error.code || error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function calculateCutoff(event) {
    event.preventDefault();

    const maths = Number(marks.mathematics);
    const physics = Number(marks.physics);
    const chemistry = Number(marks.chemistry);

    const valid = [maths, physics, chemistry].every(
      (mark) => Number.isFinite(mark) && mark >= 0 && mark <= 100
    );

    if (!valid) {
      setMessage("Enter valid marks between 0 and 100.");
      return;
    }

    const result = maths + physics / 2 + chemistry / 2;

    setCutoff(result);
    setMessage("");
    setStep("community");
  }

  function resetPrediction() {
    setMarks({
      mathematics: "",
      physics: "",
      chemistry: "",
    });
    setCutoff(null);
    setCommunity("");
    setCourse("");
    setSelectedCollege(null);
    setStep("field");
  }

  async function handleLogout() {
    await signOut(auth);

    setUser(null);
    setStep("welcome");
    setMessage("");
  }

  const matchingColleges = colleges.filter((college) =>
    college.courses.includes(course)
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">EN</span>
          <span>Education Navigator</span>
        </div>

        {user && (
          <button className="logout-button" onClick={handleLogout}>
            Sign out
          </button>
        )}
      </header>

      <section className="main-content">
        <div className="progress-label">
          {user ? "YOUR EDUCATION JOURNEY" : "YOUR FUTURE STARTS HERE"}
        </div>

        {message && (
          <div className="message-box" role="status">
            {message}
          </div>
        )}

        {step === "welcome" && (
          <div className="welcome-card">
            <img
              className="state-emblem"
              src="https://upload.wikimedia.org/wikipedia/commons/3/32/Seal_of_Tamil_Nadu.svg"
              alt="State Emblem of Tamil Nadu"
            />

            <p className="eyebrow">WELCOME TO TAMIL NADU</p>

            <h1>
              Your Future.
              <br />
              <span>Your Path.</span>
            </h1>

            <p className="description">
              Discover courses, explore colleges, and make a more
              informed decision about your future.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (!name.trim()) {
                  setMessage("Please enter your name.");
                  return;
                }

                localStorage.setItem("studentName", name.trim());
                setMessage("");
                setStep("email");
              }}
            >
              <label htmlFor="student-name">What should we call you?</label>

              <input
                id="student-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <button className="primary-button" type="submit">
                Get Started <span>→</span>
              </button>
            </form>

            <p className="small-note">
              A little guidance today can open doors tomorrow.
            </p>
          </div>
        )}

        {step === "email" && (
          <div className="content-card">
            <span className="step-badge">STEP 01</span>

            <h1>Sign in with email</h1>

            <p className="description">
              Welcome, {name || "student"}! Enter your email to receive
              a secure sign-in link.
            </p>

            <form onSubmit={handleSendEmailLink}>
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send sign-in link"}
              </button>
            </form>

            <button
              className="text-button"
              onClick={() => {
                setMessage("");
                setStep("welcome");
              }}
            >
              ← Back
            </button>

            <p className="small-note">
              Check your inbox and spam folder. You must open the link
              to complete sign-in.
            </p>
          </div>
        )}

        {step === "field" && (
          <div className="content-card">
            <span className="step-badge">STEP 02</span>

            <h1>Hello, {name || user?.displayName || "Student"}!</h1>

            <p className="description">
              Which educational path would you like to explore?
            </p>

            <div className="option-grid">
              <button
                className="option-card"
                onClick={() => setStep("marks")}
              >
                <span className="option-icon">⚙️</span>
                <strong>Engineering</strong>
                <span>Calculate cutoff and explore colleges</span>
              </button>

              <button
                className="option-card"
                onClick={() => setStep("medical")}
              >
                <span className="option-icon">🩺</span>
                <strong>Medical</strong>
                <span>Explore the medical admission pathway</span>
              </button>
            </div>
          </div>
        )}

        {step === "marks" && (
          <div className="content-card">
            <span className="step-badge">STEP 03</span>

            <h1>Enter your marks</h1>

            <p className="description">
              Enter your Class 12 subject marks out of 100.
            </p>

            <form onSubmit={calculateCutoff}>
              {[
                ["mathematics", "Mathematics"],
                ["physics", "Physics"],
                ["chemistry", "Chemistry"],
              ].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>{label}</label>

                  <input
                    id={key}
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="0–100"
                    value={marks[key]}
                    onChange={(event) =>
                      setMarks({
                        ...marks,
                        [key]: event.target.value,
                      })
                    }
                    required
                  />
                </div>
              ))}

              <div className="formula-box">
                <strong>Cutoff formula</strong>
                <p>Mathematics + (Physics ÷ 2) + (Chemistry ÷ 2)</p>
                <small>Maximum cutoff: 200</small>
              </div>

              <button className="primary-button" type="submit">
                Calculate My Cutoff →
              </button>
            </form>
          </div>
        )}

        {step === "community" && (
          <div className="content-card">
            <span className="step-badge">STEP 04</span>

            <h1>Your engineering cutoff</h1>

            <div className="cutoff-display">
              <span>YOUR ESTIMATED CUTOFF</span>
              <strong>{cutoff?.toFixed(2)} / 200</strong>
            </div>

            <p className="description">
              Select your applicable counselling community category.
            </p>

            <label htmlFor="community">Community category</label>

            <select
              id="community"
              value={community}
              onChange={(event) => setCommunity(event.target.value)}
            >
              <option value="">Select a category</option>
              {communities.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              className="primary-button"
              disabled={!community}
              onClick={() => setStep("course")}
            >
              Continue to Courses →
            </button>
          </div>
        )}

        {step === "course" && (
          <div className="content-card">
            <span className="step-badge">STEP 05</span>

            <h1>Choose your course</h1>

            <p className="description">
              Select the engineering branch you want to explore.
            </p>

            <div className="course-list">
              {courses.map((item) => (
                <button
                  key={item}
                  className={`course-option ${
                    course === item ? "selected" : ""
                  }`}
                  onClick={() => setCourse(item)}
                >
                  <span>{item}</span>
                  <span>{course === item ? "✓" : "→"}</span>
                </button>
              ))}
            </div>

            <button
              className="primary-button"
              disabled={!course}
              onClick={() => setStep("colleges")}
            >
              Find Colleges →
            </button>
          </div>
        )}

        {step === "colleges" && (
          <div className="content-card wide-card">
            <span className="step-badge">STEP 06</span>

            <h1>Explore colleges</h1>

            <p className="description">
              Showing colleges associated with your selected course:
              <strong> {course}</strong>
            </p>

            {matchingColleges.length === 0 ? (
              <p>No sample colleges are available for this course yet.</p>
            ) : (
              <div className="college-list">
                {matchingColleges.map((college) => (
                  <article className="college-card" key={college.name}>
                    <div>
                      <h2>{college.name}</h2>
                      <p>📍 {college.location}</p>

                      <p>
                        Illustrative cutoff:{" "}
                        <strong>
                          {college.cutoffs[community]} / 200
                        </strong>
                      </p>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        setSelectedCollege(college);
                        setStep("prediction");
                      }}
                    >
                      Check eligibility
                    </button>
                  </article>
                ))}
              </div>
            )}

            <p className="disclaimer">
              Sample data only. College names and cutoff values are
              placeholders, not verified admission data.
            </p>
          </div>
        )}

        {step === "prediction" && selectedCollege && (
          <div className="content-card">
            <span className="step-badge">STEP 07</span>

            <h1>College prediction</h1>

            <p className="description">
              {selectedCollege.name} · {selectedCollege.location}
            </p>

            <div className="comparison-box">
              <div>
                <span>Your cutoff</span>
                <strong>{cutoff?.toFixed(2)}</strong>
              </div>

              <div>
                <span>Illustrative college cutoff</span>
                <strong>{selectedCollege.cutoffs[community]}</strong>
              </div>
            </div>

            <div className="prediction-result">
              {cutoff >= selectedCollege.cutoffs[community] ? (
                <>
                  <h2>Cutoff comparison: Meets the sample threshold</h2>
                  <p>
                    Your cutoff is at or above this illustrative value.
                    This does not guarantee admission.
                  </p>
                </>
              ) : (
                <>
                  <h2>Cutoff comparison: Below the sample threshold</h2>
                  <p>
                    Your cutoff is below this illustrative value.
                    Explore other colleges and verify official counselling
                    data before making decisions.
                  </p>
                </>
              )}
            </div>

            <p className="disclaimer">
              This is an educational estimate only. Actual admission
              depends on official counselling rules, seat availability,
              category, course, year, and other applicable criteria.
            </p>

            <button
              className="primary-button"
              onClick={() => {
                setSelectedCollege(null);
                setStep("colleges");
              }}
            >
              ← Back to Colleges
            </button>

            <button className="text-button" onClick={resetPrediction}>
              Start a New Prediction
            </button>
          </div>
        )}

        {step === "medical" && (
          <div className="content-card">
            <span className="step-badge">MEDICAL PATHWAY</span>

            <h1>Medical guidance</h1>

            <p className="description">
              The medical section is the next module to develop.
              Medical admissions use a different process from engineering
              cutoff calculations, so the engineering formula must not
              be used here.
            </p>

            <button
              className="primary-button"
              onClick={() => setStep("field")}
            >
              ← Back to Field Selection
            </button>
          </div>
        )}
      </section>

      <footer className="footer">
        <span>EDUCATION NAVIGATOR</span>
        <span>Learn · Explore · Decide</span>
      </footer>
    </main>
  );
}