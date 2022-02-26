const AMOUNT_OF_COLUMNS = 7
// for prod
// const taskUrl = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks'
// const usersUrl = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users'

// for development
const taskUrl = 'tasks.json'
const usersUrl = 'users.json'

async function getData(url) {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(response.statusText)

  const data = response.json()
  return data
}

function defineDates(tasks) {
  const dates = []

  const earliestDate = tasks => {
    let earliestDate = 0
    for (let i in tasks) {
      if (earliestDate < Date.parse(tasks[i].planStartDate)) {
        earliestDate = tasks[i].planStartDate
      }
    }
    return earliestDate
  }

  const firstColumn = earliestDate(tasks)

  for (let i = 0; i < AMOUNT_OF_COLUMNS; i++) {
    let date = new Date(Date.parse(firstColumn) + (i * 86400000))
    date = date.toISOString().split('T')[0]
    dates.push(date)
  }

  dates.unshift('Previous')
  return dates
}

async function createApp() {
  const tasks = await getData(taskUrl)
  const users = await getData(usersUrl)
  const dates = defineDates(tasks)

  function defineExecutors() {
    const executors = []
    for (let i = 0; i < users.length; i++) {
      executors.push(users[i].firstName)
    }

    return executors
  }
  const executors = defineExecutors()

  function defineBacklog(tasks) {
    const backlog = []
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].executor) {
        backlog.push(tasks[i])
      }
    }
    return backlog
  }
  const backlog = defineBacklog(tasks)

  const root = document.getElementById("root")
  const table = document.createElement('div')
  table.classList = "table"
  table.style.gridTemplateColumns = `repeat(${AMOUNT_OF_COLUMNS + 1}, 1fr)`


  function createTable() {
    root.appendChild(table)
    for (let i = 0; i <= AMOUNT_OF_COLUMNS; i++) {
      const header = document.createElement('div')
      table.appendChild(header)
      for (let j = 0; j <= executors.length; j++) {
        const cell = document.createElement('div')
        cell.classList = "table__cell"
        cell.id = `${"x" + i + "y" + j}`
        header.appendChild(cell)
      }
    }
  }

  function createTableHeaders() {
    const headers = document.querySelectorAll('.table div :first-child')
    for (let i = 0; i < dates.length; i++) {
      headers[i].textContent = dates[i]
      headers[i].classList = 'table__header'
    }
  }

  function createExecutors() {
    const executorCells = document.querySelectorAll('.table :first-child div.table__cell')
    for (let i = 0; i < executors.length; i++) {
      executorCells[i].className = "table__executor"
      executorCells[i].textContent = executors[i]
    }
  }

  function assignTasks() {
    const cells = document.querySelectorAll('.table__cell')
    console.log(cells)
  }

  function makePrevButton() {
    nextButton = document.querySelector('.table :first-child :first-child')
    nextButton.textContent = "Previous"
    nextButton.style.backgroundColor = 'rgb(207, 255, 250)';
  }

  function makeNextButton() {
    nextButton = document.querySelector('.table :last-child :first-child')
    nextButton.textContent = "Next"
    nextButton.style.backgroundColor = 'rgb(207, 255, 250)';
  }

  function createBacklog() {
    backlogHTML = document.getElementById("backlog")
    for (let i = 0; i < backlog.length; i++) {
      const task = backlog[i]
      const div = document.createElement("div")
      div.className = "backlog__task"
      div.innerHTML = `
                      <div class="backlog__title">${task.subject}</div>
                      <div class="backlog__description">${task.description}</div>
                    `
      backlogHTML.appendChild(div)
    }
  }

  createTable()
  createTableHeaders()
  createExecutors()
  makePrevButton()
  makeNextButton()
  assignTasks()
  createBacklog()
}

createApp()