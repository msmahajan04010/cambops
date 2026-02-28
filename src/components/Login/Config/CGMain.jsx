import React, { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import Layout from "../Layout/AdminLayout";
import toast from "react-hot-toast";


export default function ConfigMaster() {
  const [recordingAmount, setRecordingAmount] = useState("");
  const [splittingAmount, setSplittingAmount] = useState("");
  const [qcAmount, setqcAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const snap = await getDoc(doc(db, "config", "rates"));

      if (snap.exists()) {
        const data = snap.data();
        setRecordingAmount(data.recordingAmount || "");
        setSplittingAmount(data.splittingAmount || "");
        setqcAmount(data.qcAmount || "")
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error loading config:", error);
    }
  };

  const handleSave = async () => {
    if (!recordingAmount || !splittingAmount || !qcAmount) {
      toast.error("Please fill all the required fields.");
      return;
    }

    try {
      setLoading(true);
      await setDoc(doc(db, "config", "rates"), {
        recordingAmount: Number(recordingAmount),
        splittingAmount: Number(splittingAmount),
        qcAmount: Number(qcAmount),
        updatedAt: new Date(),
      });

      toast.success("Configuration saved successfully.");
      handleCancel();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error saving config:", error);
    }
  };

  const handleCancel = () => {
    loadConfig(); // reload previous values
  };


  if (loading) {
    return (
      <Layout title="Config Master" subtitle="Manage system rates">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Config Master" subtitle="Manage system rates">
      <div className="max-w-xl mx-auto bg-gray-900 p-8 rounded-xl text-white">

        <div className="space-y-6">

          <div>
            <label className="block mb-2">Recording Amount</label>
            <input
              type="number"
              value={recordingAmount}
              onChange={(e) => setRecordingAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700"
            />
          </div>

          <div>
            <label className="block mb-2">Splitting Amount</label>
            <input
              type="number"
              value={splittingAmount}
              onChange={(e) => setSplittingAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700"
            />
          </div>

          <div>
            <label className="block mb-2">QC Amount</label>
            <input
              type="number"
              value={qcAmount}
              onChange={(e) => setqcAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-white text-black py-3 rounded-xl font-semibold"
            >
              SAVE
            </button>

            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-700 py-3 rounded-xl font-semibold"
            >
              CANCEL
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
