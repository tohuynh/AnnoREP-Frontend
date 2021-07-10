import { FC } from "react"

import axios from "axios"
import { getSession } from "next-auth/client"
import { GetServerSideProps } from "next"
import qs from "qs"

import NewAtiProjectForm from "../../features/ati/NewAtiProjectForm"
import Layout from "../../features/components/Layout"

import { IDataset } from "../../types/dataverse"

interface NewAtiProps {
  isLoggedIn: boolean
  datasets: IDataset[]
  serverUrl: string
}

const NewAti: FC<NewAtiProps> = ({ isLoggedIn, datasets, serverUrl }) => {
  return (
    <Layout isLoggedIn={isLoggedIn} title="AnnoREP - New ATI Project">
      {isLoggedIn ? (
        <NewAtiProjectForm datasets={datasets} serverUrl={serverUrl} />
      ) : (
        <div>Login to create a new ATI project.</div>
      )}
    </Layout>
  )
}

export default NewAti

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  const datasets: IDataset[] = []
  if (session) {
    const { status, data } = await axios.get(
      //TODO: change to X-Dataverse-key header later
      `${session.serverUrl}/api/mydata/retrieve`,
      {
        params: {
          key: session.apiToken,
          dvobject_types: "Dataset",
          published_states: ["Published", "Unpublished", "Draft", "In Review"],
          role_ids: [5, 6, 7, 26, 27],
        },
        paramsSerializer: (params) => {
          return qs.stringify(params, { indices: false })
        },
      }
    )
    if (status === 200 && data.success) {
      const items = data.data.items
      for (let i = 0; i < items.length; i++) {
        datasets.push({
          id: items[i].entity_id,
          doi: items[i].global_id,
          title: items[i].name,
        })
      }
    }
  }
  return {
    props: {
      isLoggedIn: session ? true : false,
      severUrl: process.env.DATAVERSE_SERVER_URL,
      datasets,
    },
  }
}
