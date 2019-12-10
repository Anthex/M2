from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func
import random
import hashlib
import time

DBNAME='users.db'

engine = create_engine('sqlite:///'+DBNAME,connect_args={'check_same_thread': False})
base = declarative_base()
Session = sessionmaker(bind=engine)
session = Session()

class user(base):
    __tablename__ = "user"
    ID = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String)
    can_view_map = Column(Boolean, default=1)
    is_admin = Column(Boolean, default=0)
    can_edit_features = Column(Boolean, default=0) #update GW, rename TM
    can_beep = Column(Boolean, default=0) 
    pass_hash = Column(String(128))
    token = Column(String(128))
    token_date = Column(DateTime(timezone=True), server_default=func.now())

def authenticate(username, password_hash):
    sought_user = session.query(user).filter(user.username == username).all()
    if sought_user:
        sought_user=sought_user[0]
        if password_hash == sought_user.pass_hash:
            return 0 #auth OK
        else:
            return 1 #wrong password
    else:
        return -1 #user not found
    return 3 #other error, unreachable

def checkToken(username, token):
    sought_user = session.query(user).filter(user.username == username).all()
    if sought_user:
        sought_user=sought_user[0]
        if sought_user.token == token:
            return 0 #OK
        else:
            return 1 #invalid token
    else:
        return 2 #user not found
    return True

def generateToken(username, size=128):
    token = ''.join(random.choice('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for i in range(size))
    try:
        sought_user = session.query(user).filter(user.username == username).all()[0]
        sought_user.token = token
        sought_user.token_date = func.now()
    except:
        session.rollback()
        return -1
    else:
        session.commit()
        return token

def register(username, password_hash):
    return True

def getAccessStructure(username):
    sought_user = session.query(user).filter(user.username == username).all()
    if sought_user:
        sought_user=sought_user[0]
        access = {
            "is_admin": sought_user.is_admin,
            "can_view_map": sought_user.can_view_map,
            "can_edit_features":sought_user.can_edit_features,
            "can_beep":sought_user.can_beep
        }
        return access
    else:
        return None #user not found
