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

  const defineEarliestDate = tasks => {
    let earliestDate = 0
    for (let i in tasks) {
      if (earliestDate < Date.parse(tasks[i].planStartDate)) {
        earliestDate = tasks[i].planStartDate
      }
    }
    return earliestDate
  }
  const earliestDate = defineEarliestDate(tasks)

  const defineDates = tasks => {

    const dates = []
    const firstColumn = defineEarliestDate(tasks)

    for (let i = 0; i < AMOUNT_OF_COLUMNS; i++) {
      let date = new Date(Date.parse(firstColumn) + (i * 86400000))
      date = date.toISOString().split('T')[0]
      dates.push(date)
    }

    return dates
  }
  const dates = defineDates(tasks)
  dates.unshift('')

  const defineBacklog = tasks => {
    const backlog = []
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].executor) {
        backlog.push(tasks[i])
      }
    }
    return backlog
  }
  const backlog = defineBacklog(tasks)
  console.log("Backlog: ", backlog)

  const joinData = (tasks, users) => {

    const data = []

    for (let i = 0; i < AMOUNT_OF_COLUMNS; i++) {
      const currentDate = dates[i]
      
      for (let i = 0; i < tasks.length; i++) {
        if (currentDate === tasks[i].planStartDate ) {
          
          for (let j = 0; j < users.length; j++) {
            if (tasks[i].executor === users[j].id) {
              
              data.push({
                "executor": users[j].firstName,
                [currentDate]: tasks[i].subject
              })
            } else if (!tasks[i].executor) {
              data.push({
                "executor": null,
                [currentDate]: tasks[i].subject
              })
              break
            }
          }
        }
      }
    }

  return data
  }
  const joinedData = joinData(tasks, users)
  console.log(joinedData)

  const executors = [...new Set(joinedData.filter(task => task.executor).map(task => task.executor))]
  console.log(executors)
  executors.unshift('')

  const root = document.getElementById("root")
  const table = document.createElement('table')

  for (let i = 0; i < executors.length; i++) {
    const executor = executors[i]
    const tableRow = table.insertRow()

    for (let j = 0; j < dates.length; j++) {
      const date = dates[j]
      const cell = tableRow.insertCell()

      if (i < executors.length && j == 0) {
        cell.appendChild(document.createTextNode(`${executor}`))
      } else if (i == 0 && 0 < j < dates.length) {
        cell.appendChild(document.createTextNode(`${date}`))
      } else {
        const task = joinedData[i][date]
        if (task) {
          cell.appendChild(document.createTextNode(task))
        }
      }
    }
  }

  root.appendChild(table);

}


createGrid()