let socket;

const trash = `<svg style="transform: scale(0.4)" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m4.015 5.494h-.253c-.413 0-.747-.335-.747-.747s.334-.747.747-.747h5.253v-1c0-.535.474-1 1-1h4c.526 0 1 .465 1 1v1h5.254c.412 0 .746.335.746.747s-.334.747-.746.747h-.254v15.435c0 .591-.448 1.071-1 1.071-2.873 0-11.127 0-14 0-.552 0-1-.48-1-1.071zm14.5 0h-13v15.006h13zm-4.25 2.506c-.414 0-.75.336-.75.75v8.5c0 .414.336.75.75.75s.75-.336.75-.75v-8.5c0-.414-.336-.75-.75-.75zm-4.5 0c-.414 0-.75.336-.75.75v8.5c0 .414.336.75.75.75s.75-.336.75-.75v-8.5c0-.414-.336-.75-.75-.75zm3.75-4v-.5h-3v.5z" fill-rule="nonzero"/></svg>`;

function getFormattedDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getFormattedTime(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function setDate(date) {
    const formattedDate = getFormattedDate(date);

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

function enableForm() {
    document.querySelector("#author").removeAttribute("aria-busy");
    document.querySelector("#author").removeAttribute("disabled");
    document.querySelector("#msg-input").removeAttribute("aria-busy");
    document.querySelector("#msg-input").removeAttribute("disabled");
}

function disableForm() {
    document.querySelector("#author").setAttribute("aria-busy", "true");
    document.querySelector("#author").setAttribute("disabled", "true");
    document.querySelector("#msg-input").setAttribute("aria-busy", "true");
    document.querySelector("#msg-input").setAttribute("disabled", "true");
}

function websocket() {
    socket = new WebSocket("ws://" + location.host + "/ws");

    socket.addEventListener("open", function (event) {
        socket.send(
            JSON.stringify({
                action: "hello"
            })
        );
    });

    socket.addEventListener("message", function (event) {
        const { action, payload } = JSON.parse(event.data);

        console.log("Message from server", { action, payload });

        switch (action) {
            case "hello":
                socket.send(
                    JSON.stringify({
                        action: "receive_msgs"
                    })
                );
                break;
            case "receive_msgs":
                enableForm();

                document.querySelector("#chat").innerHTML = "";
                if (payload.length > 0) {
                    document.querySelector("#chat").appendChild(mapMessagesToTable(payload));
                    document
                        .querySelector("#chat")
                        .scrollTo(0, document.querySelector("#chat").scrollHeight);
                } else {
                    document.querySelector("#chat").innerHTML = "<p>Nessun messaggio</p>";
                }
                break;
            case "error":
                alert(payload);
                break;
        }
    });
}

/**
 * @typedef {Object} Message
 * @property {number} id
 * @property {string} author
 * @property {string} msg
 * @property {Date} date
 */

/**
 * @param {Message[]} messages
 * @returns {HTMLTableElement}
 */
function mapMessagesToTable(messages) {
    const table = document.createElement("table");
    table.classList.add("table", "table-striped", "table-hover");
    const tbody = document.createElement("tbody");

    table.appendChild(tbody);

    messages.forEach(message => {
        const tr = document.createElement("tr");
        const date = new Date(message.date);

        const tdDateAuthor = document.createElement("td");
        tdDateAuthor.textContent = `${message.author} - ${getFormattedDate(
            date
        )} ${getFormattedTime(date)}`;
        const tdMsg = document.createElement("td");
        tdMsg.textContent = message.msg;

        const tdTrash = document.createElement("td");
        const trashIcon = document.createElement("div");
        trashIcon.style.width = "2rem";
        trashIcon.style.height = "2rem";
        trashIcon.style.float = "right";
        trashIcon.style.cursor = "pointer";
        trashIcon.innerHTML = trash;
        trashIcon.addEventListener("click", () => {
            disableForm();
            socket.send(
                JSON.stringify({
                    action: "delete_msg",
                    payload: message.id.toString()
                })
            );
        });
        tdTrash.appendChild(trashIcon);

        tr.appendChild(tdDateAuthor);
        tr.appendChild(tdMsg);
        tr.appendChild(tdTrash);

        tbody.appendChild(tr);
    });

    return table;
}

// catch form write-msg on submit
document.querySelector("#write-msg").addEventListener("submit", event => {
    event.preventDefault();

    disableForm();

    const author = document.querySelector("#author").value;
    const msg = document.querySelector("#msg-input").value;

    if (!socket) {
        return;
    }

    console.log("msg", { author, msg });

    socket.send(
        JSON.stringify({
            action: "send_msg",
            payload: JSON.stringify({
                author,
                msg
            })
        })
    );
    document.querySelector("#msg-input").value = "";
});

async function run() {
    disableForm();

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

    websocket();
}

run();

// clearTurns();
// setDate();
