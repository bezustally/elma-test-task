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

  const root = document.getElementById("root")
  const table = document.createElement('div')
  table.classList = "table"
  table.style.gridTemplateColumns = `repeat(${AMOUNT_OF_COLUMNS + 1}, 1fr)`

  const tasks = await getData(taskUrl)
  const users = await getData(usersUrl)
  const dates = defineDates(tasks)

  function separateTasks(tasks) {
    const backlog = []
    const assignedTasks = []
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].executor) {
        backlog.push(tasks[i])
      } else {
        assignedTasks.push(tasks[i])
      }
    }
    return {assignedTasks, backlog}
  }
  const { assignedTasks, backlog } = separateTasks(tasks)

  function createTable() {
    root.appendChild(table)
    for (let i = 0; i <= AMOUNT_OF_COLUMNS; i++) {
      const header = document.createElement('div')
      table.appendChild(header)
      for (let j = 0; j <= users.length; j++) {
        const cell = document.createElement('div')
        cell.classList = "table__cell"
        header.appendChild(cell)
      }
    }
  }

  function createTableHeaders() {
    const headers = document.querySelectorAll('.table div :first-child')
    const today = new Date().toISOString().split('T')[0]
    headers.forEach((header, idx) => {
      if (dates[idx] === today) {
        header.parentElement.classList = 'today'
      }
      header.textContent = dates[idx]
      header.classList = 'table__header'
    })
  }

  function createExecutors() {
    const executorCells = document.querySelectorAll('.table :first-child div.table__cell')
    for (let i = 0; i < users.length; i++) {
      executorCells[i].className = "table__executor"
      executorCells[i].textContent = users[i].firstName
    }
  }

  function createCells() {
    const cells = document.querySelectorAll('.table__cell')
    for (let i = 0; i < cells.length; i++) {
      let userIndex = i % users.length
      let dateIndex = Math.floor(i / users.length) + 1
      cells[i].id = `${dates[dateIndex]} ${users[userIndex].id}`
    }
  }

  function assignTasks() {
    const cells = document.querySelectorAll('.table__cell')
    cells.forEach(cell => {
      assignedTasks.forEach(task => {
        if (task.planStartDate == cell.id.split(' ')[0] && task.executor == cell.id.split(' ')[1]) {
          cell.textContent = task.subject
          cell.classList.add("table_cell-task")
          cell.id = task.id
        }
      })
    })
  }

  function makePrevButton() {
    prevButton = document.querySelector('.table :first-child :first-child')
    prevButton.textContent = "Previous"
    prevButton.classList.add("prev-btn")
  }

  function makeNextButton() {
    nextButton = document.querySelector('.table :last-child :first-child')
    nextButton.textContent = "Next"
    nextButton.classList.add("next-btn")
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

  function createTooltips() {
    const cellsWithTask = document.querySelectorAll('.table_cell-task')
    for (let i = 0; i < cellsWithTask.length; i++) {
      const tooltip = document.createElement('span')
      tooltip.className = 'tooltip'

      const taskId = cellsWithTask[i].id
      
      for (let j = 0; j < assignedTasks.length; j++) {
        if (taskId === assignedTasks[j].id) {
          currentTask = assignedTasks[j]
          tooltip.innerHTML = `
                              ${currentTask.description}
                              <br><br>
                              срок ${currentTask.planEndDate}
                              `
        }
      }
      cellsWithTask[i].appendChild(tooltip)
    }
  }

  createTable()
  createTableHeaders()
  createExecutors()
  makePrevButton()
  makeNextButton()
  createCells()
  assignTasks()
  createBacklog()
  createTooltips()
}

createApp()