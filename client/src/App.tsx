import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout';
import DocumentPage from '@/pages/Document';
import Navbar from '@/components/custom/Navbar';
import { useDocumentStore } from '@/stores/documentStore';
import './App.css'

function App() {
  const { documentsByUser, getDocuments } = useDocumentStore();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // fetch documents on initial load
    const fetchData = async () => {
      await getDocuments();
      setIsLoading(false);
    };
    fetchData();
  }, [getDocuments]);

  useEffect(() => {
    // determine the redirect path based on documentsByUser
    if (!isLoading) {
      if (documentsByUser.length > 0) {
        setRedirectPath(`/document/${documentsByUser[0].id}`);
      } else {
        setRedirectPath('/document/new');
      }
    }
  }, [documentsByUser, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>; // show loader while fetching data
  }

  return (
    <Router>
      <div className='w-full'>
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={redirectPath ? <Navigate to={redirectPath} replace /> : null}
          />
          <Route
            path="/document/:docId"
            element={
              <Layout>
                <DocumentPage />
              </Layout>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
