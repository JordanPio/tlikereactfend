import React, { useEffect, useContext } from "react";
import DispatchContext from "../DispatchContext";
import { useImmer } from "use-immer";
import Axios from "axios";
import { Link } from "react-router-dom";
import Post from "./Post";

function Search() {
  const appDispatch = useContext(DispatchContext);
  const [state, setState] = useImmer({
    searchTerm: "",
    results: [],
    show: "neither",
    requestCount: 0
  });

  useEffect(() => {
    // this has nothign  to do with react and all web browser have this property
    document.addEventListener("keyup", searchKeyPressHandler);

    // to clean after component unmount use return
    return () => document.removeEventListener("keyup", searchKeyPressHandler);
  }, []);

  useEffect(() => {
    // if field is not blank evaluate to true
    if (state.searchTerm.trim()) {
      //setup loading icon(give illusion app is extremelly responsive)
      setState(draft => {
        draft.show = "loading";
      });
      const delay = setTimeout(() => {
        setState(draft => {
          draft.requestCount++;
        });
      }, 500);

      return () => clearTimeout(delay);
    } else {
      // set show property to neither
      setState(draft => {
        draft.show = "neither";
      });
    }
  }, [state.searchTerm]);

  useEffect(() => {
    if (state.requestCount) {
      // send axios request here
      const ourRequest = Axios.CancelToken.source();
      async function fetchResults() {
        try {
          const response = await Axios.post("/search", { searchTerm: state.searchTerm }, { cancelToken: ourRequest.token });
          setState(draft => {
            draft.results = response.data;
            draft.show = "results";
          });
        } catch (error) {
          console.log("There was a problem or the request was cancel");
        }
      }
      fetchResults();
      return () => ourRequest.cancel();
    }
  }, [state.requestCount]);

  function searchKeyPressHandler(e) {
    if (e.keyCode == 27) {
      appDispatch({ type: "closeSearch" });
    }
  }

  function handleInput(e) {
    const value = e.target.value;
    setState(draft => {
      draft.searchTerm = value;
    });
  }

  return (
    <div className="search-overlay">
      <div className="search-overlay-top shadow-sm">
        <div className="container container--narrow">
          <label htmlFor="live-search-field" className="search-overlay-icon">
            <i className="fas fa-search"></i>
          </label>
          <input onChange={handleInput} autoFocus type="text" autoComplete="off" id="live-search-field" className="live-search-field" placeholder="What are you interested in?" />
          <span onClick={() => appDispatch({ type: "closeSearch" })} className="close-live-search">
            <i className="fas fa-times-circle"></i>
          </span>
        </div>
      </div>

      <div className="search-overlay-bottom">
        <div className="container container--narrow py-3">
          <div className={"circle-loader " + (state.show == "loading" ? "circle-loader--visible" : "")}></div>
          <div className={"live-search-results " + (state.show == "results" ? "live-search-results--visible" : "")}>
            {Boolean(state.results.length) && (
              <div className="list-group shadow-sm">
                <div className="list-group-item active">
                  <strong>Search Results</strong> ({state.results.length} {state.results.length > 1 ? "items" : "item"} found)
                </div>
                {state.results.map(post => {
                  return <Post post={post} key={post._id} onClick={() => appDispatch({ type: "closeSearch" })} />;
                })}
              </div>
            )}
            {!Boolean(state.results.length) && <p className="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for this search </p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;