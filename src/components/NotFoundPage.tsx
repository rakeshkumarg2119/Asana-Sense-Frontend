import React from 'react';

interface NotFoundPageProps {
  onBackHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBackHome }) => {
  return (
    <div className="not-found-container w-full min-h-screen bg-white text-stone-900 box-border">
      <style>{`
        .not-found-container header {
          height: 100px;
          font-size: 25px;
          padding-left: 60px;
          padding-top: 50px;
          font-family: "Inconsolata", monospace;
          text-transform: uppercase;
          font-weight: bold;
          box-sizing: border-box;
        }

        .not-found-container .col-box {
          width: 49%;
          display: inline-block;
          vertical-align: top;
          box-sizing: border-box;
        }

        .not-found-container .error-img {
          width: 300px;
          float: right;
          margin-right: 30px;
          max-width: 100%;
          height: auto;
          display: block;
        }

        .not-found-container main {
          font-family: "Space Mono", monospace;
          min-height: 540px;
          padding-top: 40px;
          box-sizing: border-box;
        }

        .not-found-container h2 {
          font-size: 40px;
          font-weight: bold;
          line-height: 1.4;
          color: #333333;
          margin-bottom: 25px;
        }

        .not-found-container p {
          font-size: 20px;
          line-height: 1.5;
          color: #333333;
          margin-bottom: 25px;
        }

        .not-found-container button {
          background-color: #333333;
          color: white;
          border: none;
          text-transform: uppercase;
          padding: 15px 24px;
          font-size: 10px;
          margin-top: 20px;
          border-radius: 20px;
          cursor: pointer;
          font-family: "Space Mono", monospace;
          font-weight: bold;
          letter-spacing: 1px;
          transition: background-color 0.2s ease, transform 0.1s ease;
        }

        .not-found-container button:hover {
          background-color: #111111;
          transform: translateY(-1px);
        }

        .not-found-container button:active {
          transform: translateY(0);
        }

        .not-found-container footer {
          text-align: center;
          font-size: 20px;
          color: gray;
          font-family: "Space Mono", monospace;
          padding: 30px 0;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .not-found-container header {
            padding-left: 20px;
            padding-top: 25px;
            height: auto;
            font-size: 20px;
          }
          .not-found-container .col-box {
            width: 100%;
            display: block;
            text-align: center;
            padding: 0 20px;
          }
          .not-found-container .error-img {
            float: none;
            margin: 0 auto 30px auto;
            max-width: 250px;
          }
          .not-found-container h2 {
            font-size: 28px;
            line-height: 1.3;
          }
          .not-found-container p {
            font-size: 16px;
          }
          .not-found-container main {
            min-height: auto;
          }
          .not-found-container footer {
            font-size: 14px;
          }
        }
      `}</style>

      <header>404 not found</header>
      <main>
        <div className="col-box">
          <img
            src="https://res.cloudinary.com/yhj7u0bn/image/upload/v1790614300/error.svg"
            alt="Error Image"
            className="error-img"
          />
        </div>
        <div className="col-box">
          <h2>I have a bad news <br />for you</h2>
          <p>the page you are looking<br /> for might be removed or is<br /> temporarily unavailable </p>
          <button type="button" onClick={onBackHome}>Back to homepage</button>
        </div>
      </main>
      <footer>
        © 2026 ASANA - SENSE. Academic Capstone Project.
      </footer> 
    </div>
  );
};
