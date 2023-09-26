function setDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    document.querySelector("#date").textContent = formattedDate;
    document.querySelector("#date").removeAttribute("aria-busy");
}

function setWeekNumber(date) {
    document.querySelector("#week").innerHTML = `Settimana <strong>${getWeekNumber(date)}</strong>`;
    document.querySelector("#week").removeAttribute("aria-busy");
}
function setTurn(index, person) {
    const turn = document.querySelectorAll(".turn_div")[index];
    turn.innerHTML = `<p>${person}</p>`;
}

// get person for current week based on given index (= person[i])
function getPersonForWeek(people, index, date) {
    const weekNumber = getWeekNumber(date);
    // max settimane all'anno
    return people[(53 - weekNumber + index) % people.length];
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
    const people = ["Alle", "Salvo", "Luca"];

    const date = new Date();

    await wait(random(300, 500));
    setDate(date);

    await wait(random(100, 300));
    setWeekNumber(date);

    await wait(random(100, 500));

    for (let i = 0; i < people.length; i++) {
        await wait(random(100, 300));

        setTurn(i, getPersonForWeek(people, i, date));
    }
}

run();

// clearTurns();
// setDate();
