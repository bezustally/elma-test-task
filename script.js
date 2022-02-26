// for prod
// const taskUrl = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks'
// const usersUrl = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users'

// for development
const taskUrl = 'tasks.json'
const usersUrl = 'users.json'

const AMOUNT_OF_COLUMNS = 14

const getData = async url => {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(response.statusText)

  const data = response.json()
  return data
}

const createGrid = async () => {
  const tasks = await getData(taskUrl)
  const users = await getData(usersUrl)

  const defineDates = tasks => {
    const defineEarliestDate = tasks => {
      let earliestDate = 0
      for (let i in tasks) {
        if (earliestDate < Date.parse(tasks[i].planStartDate)) {
          earliestDate = tasks[i].planStartDate
        }
      }
      // we'll start building our columns from here:
      return earliestDate
    }

    const dates = []
    const firstColumn = defineEarliestDate(tasks)

    for (let i = 0; i < AMOUNT_OF_COLUMNS; i++) {
      let date = new Date(Date.parse(firstColumn) + (i * 86400000))
      dates.push(date)
    }

    return dates
  }

  console.log(defineDates(tasks))

  const joinData = (tasks, users) => {
    
    const data = []
    const assignedTasks = []
    const backlog = []
    
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].executor) {
        assignedTasks.push(tasks[i])
      } else {
        backlog.push(tasks[i])
      }
    }

    for (let i = 0; i < assignedTasks.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (assignedTasks[i].executor === users[j].id) {
          const date = assignedTasks[i].planStartDate
          data.push({
            "executor": users[j].firstName,
            [date]: assignedTasks[i].subject
          })
        }
      }
    }
    
    console.log(data)
    return data
  }

  const joinedData = joinData(tasks, users)

  const _table_ = document.createElement('table'),
    _tr_ = document.createElement('tr'),
    _th_ = document.createElement('th'),
    _td_ = document.createElement('td')

  function buildHtmlTable(data) {
    const table = _table_.cloneNode(false)
    const columns = createTableHead(data, table)

    for (let i = 0; i < data.length; i++) {
      const tableRow = _tr_.cloneNode(false)

      for (let j = 0; j < columns.length; j++) {
        const td = _td_.cloneNode(false)
        cellValue = data[i][columns[j]]
        td.appendChild(document.createTextNode(data[i][columns[j]] || ''))
        tableRow.appendChild(td)
      }

      table.appendChild(tableRow)
    }
    return table
  }

  function createTableHead(data, table) {
    const dates = []
    const tableRow = _tr_.cloneNode(false)

    for (let i = 0; i < data.length; i++) {
      for (let key in data[i]) {
        if (data[i].hasOwnProperty(key) && dates.indexOf(key) === -1) {
          dates.push(key)
          const th = _th_.cloneNode(false)
          th.appendChild(document.createTextNode(key))
          tableRow.appendChild(th)
        }
      }
    }

    table.appendChild(tableRow)
    return dates
  }

  const schedule = document.getElementById("schedule")
  schedule.appendChild(buildHtmlTable(joinedData))
}


createGrid()