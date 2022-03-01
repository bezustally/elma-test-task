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

  let { assignedTasks, backlog } = separateTasks(tasks)

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
      executorCells[i].id = `executor_${users[i].id}`
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
      cells[i].id = `${dates[dateIndex]}_${users[userIndex].id}`
    }
  }

  function assignTasks() {
    const cells = document.querySelectorAll('.table__cell')
    cells.forEach(cell => {
      cell.textContent = ''
      cell.classList = 'table__cell'
      assignedTasks.forEach((task, index) => {
        if (task.planStartDate == cell.id.split('_')[0] && task.executor == cell.id.split('_')[1]) {
          cell.textContent = task.subject
          cell.classList.toggle("table__cell-task")
          cell.dataset.taskId = index
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
        if (cell.childElementCount < 1) {
          const tooltip = document.createElement('span')
          tooltip.className = 'tooltip'

          const taskId = cell.id

          for (let i = 0; i < assignedTasks.length; i++) {
            if (taskId === assignedTasks[i].id) {
              currentTask = assignedTasks[i]
              tooltip.innerHTML = `
                              ${currentTask.description}
                              <br><br>
                              сроки<br>
                              ${currentTask.planStartDate}
                              <br>
                              ${currentTask.planEndDate}
                              `
            }
          }
          cell.appendChild(tooltip)
        }
      })
    }

    function operateBacklog() {
      const backloggedTasks = document.querySelectorAll('.backlog__task')

      backloggedTasks.forEach((task, idx) => {
        if (task.childElementCount < 3) {
          const tooltip = document.createElement('span')
          tooltip.className = 'tooltip'

          tooltip.innerHTML = `
                            Задача создана: ${backlog[idx].creationDate}
                            <br><br>
                            Планируется начать: ${backlog[idx].planStartDate}
                            <br>
                            Планируется закончить: ${backlog[idx].planEndDate}
                            `
          task.appendChild(tooltip)
        }
      })
    }

    operateCells()
    operateBacklog()

  }

  function createBacklog() {
    backlogHTML = document.getElementById("backlog__tasks")
    for (let i = 0; i < backlog.length; i++) {
      const task = backlog[i]
      const div = document.createElement("div")
      div.id = `backlog_${i}`
      div.dataset.taskId = task.id
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
    const items = document.querySelectorAll('.table__cell, .table__cell-task .backlog__task, .backlog, .table__executor')
    items.forEach(item => {
      item.addEventListener('dragstart', dragStart)
      item.addEventListener('dragend', dragEnd)
      item.addEventListener('dragenter', dragEnter)
      item.addEventListener('dragleave', dragLeave)
      item.addEventListener('dragover', dragOver)
      item.addEventListener('drop', dragDrop)
    })

    const backloggedTasks = document.querySelectorAll(".backlog__task")
    backloggedTasks.forEach(task => {
      task.removeEventListener('drop', dragDrop)
      task.removeEventListener('dragenter', dragEnter)
    })

    function dragEnter() {
      this.classList.value += " visiting"
    }

    function dragLeave() {
      string = this.classList.value
      newString = string.replace(' visiting', '')
      this.classList.value = newString
    }

    function dragOver(e) {
      e.preventDefault()
      e.stopPropagation()
    }

    function dragDrop(e) {
      e.preventDefault()
      e.stopPropagation()

      string = this.classList.value
      newString = string.replace(' visiting', '')
      this.classList.value = newString

      let isBackloggedTask = e.dataTransfer.getData("id").includes('backlog')
      let taskId = e.dataTransfer.getData("taskId")

      let executorId = parseInt(this.id.split("_")[1])
      let targetClass = this.classList.value

      switch (targetClass) {
        case "table__executor":
          if (isBackloggedTask) {
            let backlogId = e.dataTransfer.getData("id").split("_")[1]
            let task = backlog[backlogId]
            task.executor = executorId

            assignedTasks.push(task)
            updateTask(task)


            const taskNode = document.querySelectorAll(`[data-task-id*="${taskId}"]`)[0]
            taskNode.parentElement.removeChild(taskNode)

          } else {
            let task = assignedTasks[taskId]
            task.executor = executorId

            const taskNode = document.getElementById(`${task.id}`)
            taskNode.innerHTML = ''
            taskNode.classList = 'table__cell'
            const attributes = ["id", "data-task-id", "draggable"]
            attributes.forEach(attr => taskNode.removeAttribute(attr))
            
            updateTask(task)
          }
          break

        case "table__cell":
          console.log(e.target)
          if (isBackloggedTask) {
            let backlogId = e.dataTransfer.getData("id").split("_")[1]
            let task = backlog[backlogId]
            
            task.planStartDate = e.target.id.split("_")[0]
            task.executor = parseInt(e.target.id.split("_")[1])

            assignedTasks.push(task)
            updateTask(task)

            const taskNode = document.querySelectorAll(`[data-task-id*="${taskId}"]`)[0]
            taskNode.parentElement.removeChild(taskNode)

          } else {
            let task = assignedTasks[taskId]
            const cellId = `${task.planStartDate}_${task.executor}`

            task.planStartDate = e.target.id.split("_")[0]
            task.executor = parseInt(e.target.id.split("_")[1])

            const taskNode = document.getElementById(`${task.id}`)
            taskNode.innerHTML = ''
            taskNode.classList = 'table__cell'
            const attributes = ["id", "data-task-id", "draggable"]
            attributes.forEach(attr => taskNode.removeAttribute(attr))
            
            taskNode.setAttribute("id", cellId)
            updateTask(task)
          }
          break

        case "backlog":
          if (!isBackloggedTask) {
            let task = assignedTasks[taskId]
            task.executor = null

            const taskNode = document.getElementById(`${task.id}`)
            taskNode.innerHTML = ''
            taskNode.classList = 'table__cell'
            const attributes = ["id", "data-task-id", "draggable"]
            attributes.forEach(attr => taskNode.removeAttribute(attr))

            backlog.push(task)
            backlogHTML = document.getElementById("backlog__tasks")

            const newBacklogTask = document.createElement('div')
            newBacklogTask.id = `backlog_${backlog.length-1}`
            newBacklogTask.dataset.taskId = task.id
            newBacklogTask.className = "backlog__task"
            newBacklogTask.draggable = true
            newBacklogTask.innerHTML = `
                                        <div class="backlog__title">${task.subject}</div>
                                        <div class="backlog__description">${task.description}</div>
                                      `
            const tooltip = document.createElement('span')
            tooltip.className = 'tooltip'
            tooltip.innerHTML = `
                                  Задача создана: ${task.creationDate}
                                  <br><br>
                                  Планируется начать: ${task.planStartDate}
                                  <br>
                                  Планируется закончить: ${task.planEndDate}
                                `
            newBacklogTask.appendChild(tooltip)
            const backlogTasks = document.getElementById("backlog__tasks")
            backlogTasks.appendChild(newBacklogTask)
            
            }
          break
      }

      function updateTask(task) {

        const cells = document.querySelectorAll('.table__cell')
        cells.forEach(cell => {
          if (task.planStartDate == cell.id.split('_')[0] && task.executor == cell.id.split('_')[1]) {
            cell.textContent = task.subject
            cell.classList.toggle("table__cell-task")
            cell.dataset.taskId = assignedTasks.indexOf(task)
            cell.id = task.id
            cell.draggable = true

            let tooltip = document.createElement('span')
            tooltip.className = 'tooltip'
            tooltip.innerHTML = `
                            ${task.description}
                            <br><br>
                            сроки<br>
                            ${task.planStartDate}
                            <br>
                            ${task.planEndDate}
                            `
            cell.appendChild(tooltip)
          }
        })
      }
    }

    function dragStart(e) {
      e.dataTransfer.setData("id", e.target.getAttribute('id'))
      e.dataTransfer.setData("taskId", e.target.getAttribute('data-task-id'))
      e.target.style.opacity = "0.5"
      tooltip = e.target.getElementsByClassName('tooltip')[0]
      tooltip.classList = "hidden"
    }

    function dragEnd(e) {
      e.target.style.opacity = "1"
      tooltip = e.target.getElementsByClassName('hidden')[0] || {}
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