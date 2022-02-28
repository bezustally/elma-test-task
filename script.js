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
  
  const tasks = await getData(taskUrl)
  const users = await getData(usersUrl)
  let dates = defineDates(tasks)

  const { assignedTasks, backlog } = separateTasks(tasks)

  function createTable() {
    const root = document.getElementById("root")
    const table = document.createElement('div')
    table.classList = "table"
    table.style.gridTemplateColumns = `repeat(${AMOUNT_OF_DAYS + 1}, 1fr)`
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

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (i == 0) {
        header.parentElement.classList = 'executors'
      }
      if (dates[i] === TODAY) {
        header.parentElement.classList = 'today'
      }
      header.textContent = dates[i]
      header.classList = 'table__header'
    }   
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
          cell.classList.toggle("table__cell-task")
          cell.id = task.id
          cell.draggable = true
        }
      })
    })
  }

  function createTooltips() {

    function operateCells() {
      const cellsWithTask = document.querySelectorAll('.table__cell-task')

      cellsWithTask.forEach(cell => {
        const tooltip = document.createElement('span')
        tooltip.className = 'tooltip'

        const taskId = cell.id

        for (let i = 0; i < assignedTasks.length; i++) {
          if (taskId === assignedTasks[i].id) {
            currentTask = assignedTasks[i]
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

    function operateBacklog() {
      const backloggedTasks = document.querySelectorAll('.backlog__task')

      backloggedTasks.forEach(task => {
        const tooltip = document.createElement('span')
        tooltip.className = 'tooltip'

        for (let i = 0; i < backlog.length; i++) {
          if (task.id === backlog[i].id) {
            currentTask = backlog[i]
            tooltip.innerHTML = `
                              Задача создана: ${currentTask.creationDate}
                              <br><br>
                              Планируется начать: ${currentTask.planStartDate}
                              <br>
                              Планируется закончить: ${currentTask.planEndDate}
                              `
          }
        }
        task.appendChild(tooltip)
      })
    }

    operateCells()
    operateBacklog()

  }

  function createBacklog() {
    backlogHTML = document.getElementById("backlog")
    for (let i = 0; i < backlog.length; i++) {
      const task = backlog[i]
      const div = document.createElement("div")
      div.id = task.id
      div.className = "backlog__task"
      div.draggable = true
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

      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]
        if (i == 0) { continue }
        header.parentElement.classList = ''
        if (dates[i] === TODAY) {
          header.parentElement.classList = 'today'
        }
        header.textContent = shiftedDates[i]
        header.classList = 'table__header'
      }
    }
  }

  function createDragNDrop() {
    const draggables = document.querySelectorAll('.table__cell, .table__executor, .backlog__task')
    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', dragStart)
      draggable.addEventListener('dragend', dragEnd)
      draggable.addEventListener('dragenter', dragEnter)
      draggable.addEventListener('dragleave', dragLeave)
      draggable.addEventListener('dragover', dragOver)
      draggable.addEventListener('drop', dragDrop)
    })

    const destinations = document.querySelectorAll('.backlog, .backlog__header')
    destinations.forEach(destination => {
      destination.addEventListener('dragenter', dragEnter)
      destination.addEventListener('dragleave', dragLeave)
      destination.addEventListener('drop', dragDrop)
    })

    function dragEnter() {

      const _ = this.classList.value
      if (_ == "table__executor" || _ == "table__cell" || _ == "table__cell table__cell-task" || _ == "backlog") {
        this.style.backgroundColor = "var(--accent)"
      }
      if (_ == "backlog__header") {
        if (this.parentElement.style.backgroundColor = "var(--accent)") {
          this.style.backgroundColor = "var(--accent)"
        } else {
          this.parentElement.style.backgroundColor = "var(--accent)"
          this.style.backgroundColor = "var(--accent)"
        }
      }
    }

    function dragLeave() {

      const _ = this.classList.value
      if (_ == "table__executor" || _ == "table__cell" || _ == "table__cell table__cell-task" || _ == "backlog") {
        this.style.backgroundColor = ""
      }
      if (_ == "backlog__header") {
        if (this.parentElement.style.backgroundColor = "var(--accent)") {
          this.style.backgroundColor = ""
        }
      } else if (_ == "backlog") {
        this.getElementsByClassName('backlog__header')[0].style.backgroundColor = ""
      }
    }

    function dragOver() {
      return
    }

    function dragDrop() {
      console.log(this)
      const _ = this.classList.value
      const parent = task.parentElement

      switch (this.classList.value) {
        case "backlog":
          this.style.backgroundColor = ""
          console.log(task.id)
          break
        case "backlog__header":
          parent.style.backgroundColor = ""
          this.style.backgroundColor = ""
          console.log(task.id)
          break
        case "table__executor":
          this.style.backgroundColor = ""
          console.log(task.id)
          break
        case "table__cell":
          console.log("table cell!")
          this.style.backgroundColor = ""
          console.log(task.id)
          break
      }
    }

    function dragStart() {
      this.style.opacity = "0.5"
      console.log(this.id)
      tooltip = this.getElementsByClassName('tooltip')[0]
      tooltip.classList.value = "hidden"
    }

    function dragEnd() {
      this.style.opacity = "1"
      tooltip = this.getElementsByClassName('hidden')[0]
      tooltip.classList = "tooltip"
    }
  }

  createTable()
  createTableHeaders()
  createExecutors()
  createPrevButton()
  createNextButton()
  createCells()
  assignTasks()
  createBacklog()
  createTooltips()
  createNavigation()
  createDragNDrop()
}

createApp()