CREATE TABLE Fingerprint (
	ID integer PRIMARY KEY AUTOINCREMENT,
	timestamp datetime DEFAULT CURRENT_TIMESTAMP,

    latitude decimal,
	longitude decimal,

    d1 decimal,
    d2 decimal,
    d3 decimal,

    rssi1 decimal,
    rssi2 decimal,
    rssi3 decimal,

    n decimal,
    C decimal,

    campaign_id integer
);

.save fingerprints.db