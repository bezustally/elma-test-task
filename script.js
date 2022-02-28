const AMOUNT_OF_DAYS = 7
const TODAY = new Date().toISOString().split('T')[0]

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

  for (let i = 0; i < AMOUNT_OF_DAYS; i++) {
    let date = new Date(Date.parse(firstColumn) + (i * 86400000))
    date = date.toISOString().split('T')[0]
    dates.push(date)
  }

  dates.unshift('Previous')
  return dates
}

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
  return { assignedTasks, backlog }
}

async function createApp() {

  const root = document.getElementById("root")
  const table = document.createElement('div')
  table.classList = "table"
  table.style.gridTemplateColumns = `repeat(${AMOUNT_OF_DAYS + 1}, 1fr)`

  const tasks = await getData(taskUrl)
  const users = await getData(usersUrl)
  let dates = defineDates(tasks)

  const { assignedTasks, backlog } = separateTasks(tasks)

  function createTable() {
    root.appendChild(table)
    for (let i = 0; i <= AMOUNT_OF_DAYS; i++) {
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
    headers.forEach((header, idx) => {
      if (dates[idx] === TODAY) {
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

  function createPrevButton() {
    prevButton = document.querySelector('.table :first-child :first-child')
    prevButton.textContent = "Previous"
    prevButton.classList.add("prev-btn")
  }

  function createNextButton() {
    nextButton = document.querySelector('.table :last-child .table__header')
    nextButton.textContent = "Next"
    nextButton.classList.add("next-btn")
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
      cell.textContent = ''
      cell.classList = 'table__cell'
      assignedTasks.forEach(task => {
        if (task.planStartDate == cell.id.split(' ')[0] && task.executor == cell.id.split(' ')[1]) {
          cell.textContent = task.subject
          cell.classList.toggle("table_cell-task")
          cell.id = task.id
        }
      })
    })
  }

  function createTooltips() {
    const cellsWithTask = document.querySelectorAll('.table_cell-task')
    
    cellsWithTask.forEach(cell => {
      const tooltip = document.createElement('span')
      tooltip.className = 'tooltip'

      const taskId = cell.id

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
      cell.appendChild(tooltip)
    })

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

  function createNavigation() {
    prevBtn = document.getElementsByClassName("prev-btn")[0]
    nextBtn = document.getElementsByClassName("next-btn")[0]
    
    prevBtn.addEventListener("click", () => { navigate(-AMOUNT_OF_DAYS) })
    nextBtn.addEventListener("click", () => { navigate(+AMOUNT_OF_DAYS) })

    function shiftDates(amountOfDays) {
      shiftedDates = [...dates]
      for (i = 1; i < shiftedDates.length; i++) {
        let timestamp = Date.parse(shiftedDates[i]) + 86400000 * amountOfDays
        let newDate = new Date(timestamp)
        date = newDate.toISOString().split('T')[0]
        shiftedDates[i] = date
      }
      dates = [...shiftedDates]
      return dates
    }

    function navigate(days) {
      updateHeaders(days)
      createPrevButton()
      createNextButton()
      createCells()
      assignTasks()
      createTooltips()
    }
    
    function updateHeaders(amountOfDays) {
      shiftDates(amountOfDays)
      
      const headers = document.querySelectorAll('.table div .table__header')
      headers.forEach((header, idx) => {
        header.parentElement.classList = ''
        if (dates[idx] === TODAY) {
          header.parentElement.classList = 'today'
        }
        header.textContent = shiftedDates[idx]
        header.classList = 'table__header'
      })
    }

  }

  createTable()
  createTableHeaders()
  createExecutors()
  createPrevButton()
  createNextButton()
  createCells()
  assignTasks()
  createTooltips()
  createBacklog()
  createNavigation()
}

createApp()