import React from "react";
import { BrowserRouter , Route , Routes } from "react-router-dom";
import Room from "./Room";


const Landing  = () =>{
    return(
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/room/:roomId/:userId" element={<Room />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default Landing;