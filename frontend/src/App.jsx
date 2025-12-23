import { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; 

const API_URL = "http://127.0.0.1:8000/api/articles";

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch immediately when page opens
    fetchArticles();

    // 2. AUTO-REFRESH: Fetch again every 2 seconds
    // This allows the UI to update automatically as the AI finishes processing
    const interval = setInterval(() => {
      fetchArticles();
    }, 2000);

    // 3. Cleanup: Stop the timer if the user leaves the page
    return () => clearInterval(interval);
  }, []);

  async function fetchArticles() {
    try {
      const res = await axios.get(API_URL);
      setArticles(res.data);
    } catch (err) {
      console.error("Error fetching articles", err);
    } finally {
      // Only show the big "Loading..." alert on the very first load
      if (loading) setLoading(false);
    }
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand mb-0 h1">BeyondChats Content Improver</span>
        </div>
      </nav>

      <div className="container">
        {loading && <div className="alert alert-info">Loading articles...</div>}

        <div className="row">
          {articles.map((article) => (
            <div className="col-12 mb-5" key={article._id || article.id}>
              <div className="card shadow">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="m-0">{article.title}</h5>
                  <span className="badge bg-secondary">v{article.version || 1}</span>
                </div>
                
                <div className="card-body">
                  <div className="row">
                    {/* Left Column: Original Scrape */}
                    <div className="col-md-6 border-end">
                      <h6 className="text-muted text-uppercase fw-bold mb-3">Original Scrape</h6>
                      <div 
                        className="article-content text-muted small"
                        style={{ maxHeight: '400px', overflowY: 'auto' }}
                        // Renders the raw HTML scraped from BeyondChats
                        dangerouslySetInnerHTML={{ __html: article.content }} 
                      />
                      <a href={article.source_url} target="_blank" className="btn btn-link btn-sm mt-2 px-0">
                        View Source
                      </a>
                    </div>

                    {/* Right Column: AI Version */}
                    <div className="col-md-6 bg-light p-3 rounded">
                      <h6 className="text-primary text-uppercase fw-bold mb-3">✨ AI Enhanced Version</h6>
                      {article.ai_content ? (
                        <div 
                          className="article-content"
                          // Renders the AI-generated HTML
                          dangerouslySetInnerHTML={{ __html: article.ai_content }} 
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-50">
                          <span className="badge bg-warning text-dark">Waiting for AI Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;