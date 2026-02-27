
import Login from './components/Login/Login'
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";   // 👈 THIS LINE IS REQUIRED
import Dashboard from './components/Login/Dasboard/Dashboard';
import BookMaster from './components/Login/BookMaster/BookMain';
import UserEntryScreen from './components/Login/UserAssignMaster/UAMMain';
import TransactionMaster from './components/Login/TransactionMaster/TMMain';
import AdminLayout from './components/Login/Layout/AdminLayout';
import UserMaster from './components/Login/UserMaster/UMMain';
import UserList from './components/Login/UserMaster/UMList';
import BookList from './components/Login/BookMaster/BMList';
import UserAssignList from './components/Login/UserAssignMaster/UAMList';
import BookDetails from './components/Login/UserAssignMaster/UAMCheck';
import ConfigMaster from './components/Login/Config/CGMain';
import QCModule from './components/Login/QC/QCMain';
import MyAssignments from './components/Login/Assignments/AMMain';
import TransactionHistory from './components/Login/TransactionMaster/TMList';
import { Toaster } from "react-hot-toast";

function App() {


  return (
    <> 
     <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#fff",
            border: "1px solid #374151"
          }
        }}
      />
    <Routes>
      {/* LOGIN ROUTE */}
      <Route path="/" element={<Login />} />
      <Route
        path="/DB"
        element={

          <Dashboard />

        }
      />
      <Route path="/BM" element={<BookMaster />} />
      <Route path="/UAM" element={<UserEntryScreen />} />
      <Route path="/TM" element={<TransactionMaster />} />
      <Route path="/UM" element={<UserMaster />} />
      <Route path="/UMList" element={<UserList />} />
      <Route path="/BMList" element={<BookList />} />
      <Route path="/UAMList" element={<UserAssignList />} />
      <Route path="/BDetails/:bookId" element={<BookDetails />} />
         <Route path="/CM" element={<ConfigMaster />} />
          <Route path="/MyAM" element={<MyAssignments />} />
           <Route path="/QC" element={<QCModule />} />

    <Route path="/TMList" element={<TransactionHistory />} />


    </Routes>
    </>
  );
}

export default App;

