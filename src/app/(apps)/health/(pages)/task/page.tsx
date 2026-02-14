import React from 'react'
import TaskListPage from '../../(components)/task/TaskListPage'

type PageProps = {
  params: any
  searchParams: any
}

export default async function Page(props: PageProps) {
  return <TaskListPage />
}
