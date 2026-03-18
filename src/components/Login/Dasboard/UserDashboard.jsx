import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import SimpleDashboard from "./SimpleDashboard";
import Layout from "../Layout/AdminLayout";

export default function AssignmentDashboard() {

    const [assignments, setAssignments] = useState([]);






    useEffect(() => {
        const fetchAssignments = async () => {
            const snap = await getDocs(collection(db, "chapterAssignments"));
            setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };

        fetchAssignments();
    }, []);


    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    }
    const userId = getCookie("userId");

    const recTasks = assignments.filter(
        a => a.recording?.userId === userId && [1, 2].includes(a.recording?.status)
    ).length;

    const splitTasks = assignments.filter(
        a => a.splitting?.userId === userId && [1, 2].includes(a.splitting?.status)
    ).length;

    const qcTasks = assignments.filter(
        a => a.qc?.userId === userId && [1, 2].includes(a.qc?.status)
    ).length;

    const correctionTasks = assignments.filter(
        a => a.correction?.userId === userId && [1, 2].includes(a.correction?.status)
    ).length;

    return (
         <Layout title="My Assignments" subtitle="View and Check all Assignment in the System"> 
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            <SimpleDashboard
                title="Recording Tasks"
                icon="🎙️"
                count={recTasks}
                color="indigo"
                param="rec"
            />

            <SimpleDashboard
                title="Splitting Tasks"
                icon="✂️"
                count={splitTasks}
                color="amber"
                param="split"
            />

            <SimpleDashboard
                title="QC Tasks"
                icon="🔍"
                count={qcTasks}
                color="emerald"
                param="qc"
            />

            <SimpleDashboard
                title="Correction Tasks"
                icon="🛠️"
                count={correctionTasks}
                color="rose"
                param="correction"
            />

        </div>
        </Layout>
    );
}