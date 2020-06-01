import React from 'react'

export default () => (
    <div className="welcome-fold">
        <div className="row">
            <div className="col-sm-2 col-lg d-none d-sm-block text-right">
                <span className="fancy">{'{'}</span>
            </div>

            <div className="col-sm-8 col-lg title-block">
                <h1 className="title">Picshift</h1>
                <hr className="thicc-line" />
                <div className="subtitle mb-1">Reclaim your photos.</div>
            </div>

            <div className="col-sm-2 col-lg d-none d-sm-block text-left">
                <span className="fancy">{'}'}</span>
            </div>
        </div>
    </div>
)
