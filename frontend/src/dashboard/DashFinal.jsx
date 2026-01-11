import React from 'react'
import { useParams } from 'react-router-dom';
import TeacherDashboard from './TeacherDashboard/TeacherDashboard.jsx';
import DashboardLayout from './DashboardLayout/DashboardLayout.jsx';
const DashFinal = () => {
  return (
    <div>
        <DashboardLayout>
          <TeacherDashboard />
        </DashboardLayout>
    </div>
  )
}

export default DashFinal
