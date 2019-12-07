CREATE TABLE GW (
	ID integer PRIMARY KEY AUTOINCREMENT,
	position integer
);

CREATE TABLE TM_record (
	ID integer PRIMARY KEY AUTOINCREMENT,
	position integer,
	TM_ID integer,
	timestamp datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE position (
	ID integer PRIMARY KEY AUTOINCREMENT,
	latitude decimal,
	longitude decimal
);

CREATE TABLE TM (
	ID integer PRIMARY KEY AUTOINCREMENT,
	Name string
);

.save objects.db