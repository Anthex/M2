CREATE TABLE user (
	ID integer PRIMARY KEY AUTOINCREMENT,
	username varchar,
	can_view_map boolean,
	is_admin boolean,
	can_edit_features boolean,
	can_beep boolean,
	req_admin boolean,
	req_edit boolean,
	req_beep boolean,
	pass_hash text,
	token text,
	token_date datetime
);


.save users.db