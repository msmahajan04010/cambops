import React from "react";
import Layout from "../Layout/AdminLayout";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import toast from "react-hot-toast";

export default function TruncatePage() {

  const handleResetData = async () => {

    const confirm1 = window.confirm(
      "⚠️ WARNING: This will DELETE ALL DATA from Firestore.\n\nAre you sure?"
    );

    if (!confirm1) return;

    const confirm2 = window.prompt(
      "Type Password to confirm permanent wipe:"
    );

    if (confirm2 !== "Admin@123") {
      toast.error("Confirmation failed.");
      return;
    }

    try {
      toast.loading("Deleting database...");

      const collectionsToDelete = [
        "books",
        "chapterAssignments",
        "config",
        "test",
        "transactions",
        "users"
      ];

      for (const collectionName of collectionsToDelete) {
        const snapshot = await getDocs(collection(db, collectionName));

        if (!snapshot.empty) {
          const batch = writeBatch(db);

          snapshot.docs.forEach((document) => {
            batch.delete(doc(db, collectionName, document.id));
          });

          await batch.commit();
        }
      }

      toast.dismiss();
      toast.success("🔥 All Collections Deleted Successfully!");

    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("❌ Error clearing database");
    }
  };

  return (
    <Layout title="Truncate Database" subtitle="Danger Zone">
      <div className="bg-red-900/20 border border-red-800 p-10 rounded-xl text-white">
        <h2 className="text-2xl font-bold text-red-400 mb-6">
          ⚠️ Danger Zone
        </h2>

        <p className="mb-6 text-gray-300">
          This will permanently delete ALL system data.
        </p>

        <button
          onClick={handleResetData}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold"
        >
          🔥 Truncate Entire Database
        </button>
      </div>
    </Layout>
  );
}