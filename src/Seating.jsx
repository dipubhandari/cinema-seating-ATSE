import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "./CinemaSeating.css";

const rows = 10;
const cols = 23;
const seatCols = [...Array(cols).keys()].filter((c) => c !== 8 && c !== 14);
const vipSeats = [
  [5, 3],
  [5, 4],
  [5, 5],
  [5, 6],
  [5, 7],
  [4, 9],
  [4, 10],
  [4, 11],
  [4, 12],
  [4, 13],
  [5, 15],
  [5, 16],
  [5, 17],
  [5, 18],
  [5, 19],
];
const accessibleSeats = [
  [9, 0],
  [9, 1],
  [0, 6],
  [0, 5],
  [0, 11],
  [0, 16],
];
const brokenChance = 0.1;

const mostPopularRows = [3, 4, 5, 6];
const popularRows = [7, 8, 9];

function CinemaSeating() {
  const [grid, setGrid] = useState([]);
  const [groupCounter, setGroupCounter] = useState(1);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [groupSize, setGroupSize] = useState(4);
  const [darkMode, setDarkMode] = useState(false);
  const [userType, setUserType] = useState(true);

  ////////////////////////////////////////////////////////////
  // WHEN USER WANTS TO SWITCH THE USERTYPE THIS MEHTOD TRIGGERS
  function swithUserType() {
    localStorage.setItem("accountType", !userType);
    setUserType(!userType);
    console.log(localStorage.getItem("accountType"));
    toast(`You are now ${!userType ? "Normal User" : "Admin"}`);
  }

  ///////////////////////////////////////////////////////////
  useEffect(() => {
    localStorage.setItem("accountType", true);
    initGrid();
  }, []);
  // getting the priority rows from the seats
  function getPriorityRows() {
    const allRows = [...Array(rows).keys()];
    const used = new Set([...mostPopularRows, ...popularRows]);
    const lessPopular = allRows.filter((r) => !used.has(r));
    return [...mostPopularRows, ...popularRows, ...lessPopular];
  }
  //getting the priority rows from the seats ends here---------------------------------

  function createSeat(row, col, type = "available") {
    return { row, col, type, groupId: null, animation: false };
  }
  // initiallize the grid of the seats
  function initGrid() {
    const newGrid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (seatCols.includes(c)) {
          row.push(createSeat(r, c));
        } else {
          row.push(null);
        }
      }
      newGrid.push(row);
    }

    vipSeats.forEach(([r, c]) => (newGrid[r][c].type = "vip"));
    accessibleSeats.forEach(([r, c]) => (newGrid[r][c].type = "accessible"));

    for (let row of newGrid) {
      for (let seat of row) {
        if (seat && seat.type === "available" && Math.random() < brokenChance) {
          seat.type = "broken";
        }
      }
    }

    setGrid(newGrid);
    setBookingHistory([]);
    setGroupCounter(1);
  }
  // -----------------------initiallize the grid of the seats ends here------------------------------------

  // check if block of groupsize can be placed in a row
  function isValidGroupSpot(row, startCol, size) {
    if (startCol + size > seatCols.length) return false;
    const realCols = seatCols.slice(startCol, startCol + size);
    const blockStart = seatCols[startCol];
    const blockEnd = seatCols[startCol + size - 1];
    if (
      (blockStart <= 7 && blockEnd > 7) ||
      (blockStart <= 13 && blockEnd > 13)
    )
      return false;
    for (let col of realCols) {
      if (grid[row][col].type !== "available") return false;
    }
    return true;
  }
  // ------------// check if block of groupsize can be placed in a row ends here--------------------

  // runs when clicked on Add Group button to allocate the seats
  function assignGroup(size) {
    // get the priorityrows according to the priority and keep in variable
    const priorityRows = getPriorityRows();
    const newGrid = JSON.parse(JSON.stringify(grid));
    // outer loop goes prority wise
    for (let r of priorityRows) {
      for (let i = 0; i <= seatCols.length - size; i++) {
        // if seats found
        if (isValidGroupSpot(r, i, size)) {
          console.log("seat found");
          const colsToAssign = seatCols.slice(i, i + size);
          const booking = [];
          for (let col of colsToAssign) {
            newGrid[r][col].type = "occupied";
            newGrid[r][col].groupId = `G${groupCounter}`;
            newGrid[r][col].animation = true;
            // keep the booking in a booking variable
            booking.push({ row: r, col });
          }
          setGrid(newGrid);
          setBookingHistory((prev) => [...prev, booking]);
          setGroupCounter((prev) => prev + 1);
          return;
        }
      }
    }
    // if rows finished to scan and not found the seat this message
    toast.warn("No space for group of " + size)
  }
  // ---------- runs when clicked on Add Group button to allocate the seats ends here---------------

  // runs when user click on solo allocation button
  function assignIndividual() {
    const priorityRows = getPriorityRows();
    const newGrid = JSON.parse(JSON.stringify(grid));
    // these are the corner seats priority for solo booking
    const cornerSeats = [
      [0, 0],
      [0, 22],
      [9, 0],
      [9, 22],
      [4, 0],
      [4, 22],
      [5, 0],
      [5, 22],
    ];
    const isCornerSeat = (r, c) =>
      cornerSeats.some(([row, col]) => row === r && col === c);
    const isEndSeat = (r, c) =>
      c === seatCols[0] || c === seatCols[seatCols.length - 1];

    for (let r of priorityRows) {
      for (let c of seatCols) {
        const seat = newGrid[r][c];
        if (
          seat.type === "available" &&
          (isCornerSeat(r, c) || isEndSeat(r, c))
        ) {
          seat.type = "occupied";
          seat.groupId = `S${groupCounter}`;
          seat.animation = true;
          setGrid(newGrid);
          setBookingHistory((prev) => [...prev, [{ row: r, col: c }]]);
          setGroupCounter((prev) => prev + 1);
          return;
        }
      }
    }

    for (let r of priorityRows) {
      for (let c of seatCols) {
        const seat = newGrid[r][c];
        if (seat.type !== "available") continue;
        const leftIdx = seatCols.indexOf(c) - 1;
        const rightIdx = seatCols.indexOf(c) + 1;
        const left =
          seatCols[leftIdx] !== undefined
            ? newGrid[r][seatCols[leftIdx]]
            : null;
        const right =
          seatCols[rightIdx] !== undefined
            ? newGrid[r][seatCols[rightIdx]]
            : null;
        if (left?.type === "occupied" && right?.type === "occupied") continue;
        seat.type = "occupied";
        seat.groupId = `S${groupCounter}`;
        seat.animation = true;
        setGrid(newGrid);
        setBookingHistory((prev) => [...prev, [{ row: r, col: c }]]);
        setGroupCounter((prev) => prev + 1);
        return;
      }
    }

    alert("No space for individual");
  }
  // --------------------------runs when user click on solo allocation button --------------------------

  // to cancel booking
  function cancelLastBooking() {
    // this code runs only if you are admin
    if (userType == false) {
      // checking the booking list
      if (bookingHistory.length === 0) {
        // if not found booking than notify the no boking found
      toast.error(`No booking found.`);
     return;
      }
     const newGrid = JSON.parse(JSON.stringify(grid));
    //  geeting the prvious booking fromt he boooking list
     const lastBooking = bookingHistory[bookingHistory.length - 1];
    //  changing the type of the seat occupied to available
    for (let { row, col } of lastBooking) {
      newGrid[row][col].type = "available";
      newGrid[row][col].groupId = null;
    }
    setGrid(newGrid);
    setBookingHistory((prev) => prev.slice(0, -1));
    // notify the booking cancel 
      toast.success(`Booking Cancelled Successfully`);
    } else {
    // notify if you are not admin and tryihng to cancel the booking
      toast.error(`You are not an admin`);
    }
  }
  // --------to cancel booking-----------

  // function to display the seats
  function renderSeat(seat, r, c) {
    if (!seat) return <div key={`empty-${r}-${c}`} className="empty-space" />;
    const rowLabel = String.fromCharCode(65 + r);
    const seatNumber = seatCols.indexOf(c) + 1;
    const seatLabel = `${rowLabel}${seatNumber}`;
    let classes = `seat ${seat.type}`;
    if (seat.animation) classes += " booked-anim";
    if (mostPopularRows.includes(r)) classes += " most-popular";
    else if (popularRows.includes(r)) classes += " popular";
    else classes += " less-popular";
    return (
      <div
        key={`${r}-${c}`}
        className={classes}
        title={`Seat ${seatLabel} - ${seat.type.toUpperCase()}`}
      >
        {seatLabel}
      </div>
    );
  }
  // ---------- function to display the seats ends here ---------------
  return (
    <div className={`App ${darkMode ? "dark-mode" : ""}`}>
      <ToastContainer />
      <h1 className="header">
        {" "}
        {userType ? "Normal User" : "Admin"} at ATSE CINEMA{" "}
      </h1>
      <div className="controls">
        <label htmlFor="groupSize">
          <strong>Group Size:</strong>
        </label>
        <input
          type="number"
          id="groupSize"
          min="2"
          max="7"
          value={groupSize}
          onChange={(e) => setGroupSize(parseInt(e.target.value))}
        />
        <button onClick={() => assignGroup(groupSize)}>🎟️ Book Seat</button>
        <button onClick={assignIndividual}>👤 Add Solo</button>
        <button onClick={cancelLastBooking}>❌ Cancel Previous Booking</button>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={swithUserType}>
          {userType ? "🔒 Switch to Admin" : " 👤 Switch to Normal"}
        </button>
      </div>

      <div className="legend">
        {[
          ["available", "Available"],
          ["occupied", "Occupied"],
          ["vip", "VIP"],
          ["accessible", "Accessible"],
          ["broken", "Broken"],
        ].map(([cls, label]) => (
          <div className="legend-item" key={cls}>
            <div className={`color-box ${cls}`} /> {label}
          </div>
        ))}
        <div className="legend-item">
          <div
            className="color-box"
            style={{  border: "2px solid #0022ff" }}
          ></div>{" "}
          Most Popular Row
        </div>
        <div className="legend-item">
          <div
            className="color-box"
            style={{ border: "2px solid #ff0000" }}
          ></div>{" "}
          Popular Row
        </div>
        <div className="legend-item">
          <div
            className="color-box"
            style={{  border: "2px solid rgb(228, 25, 157)" }}
          ></div>{" "}
          Less Popular Row
        </div>
      </div>

      <div className="screen">🎬 CINEMA SCREEN</div>

{/* cinema seats */}
      <div className="cinema">
        {grid.map((row, r) => row.map((seat, c) => renderSeat(seat, r, c)))}
      </div>
    
{/* cinema seats ends here */}
      {/* <ul>
        {bookingHistory.map((group, idx) => (
          <li key={idx}>
            Booking #{idx + 1}:{" "}
            {group
              .map(
                (seat) => `${String.fromCharCode(65 + seat.row)}${seat.col + 1}`
              )
              .join(", ")}
          </li>
        ))}
      </ul> */}
      <div className="footer">ATSE-CINEMA INTELLIGENT BOOKINGS &copy; 2025</div>
    </div>
  );
}

export default CinemaSeating;
