from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Boolean, or_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.sql import func
import random
import hashlib
import time

DBNAME='users.db'

engine = create_engine('sqlite:///db/'+DBNAME,connect_args={'check_same_thread': False})
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
    req_admin = Column(Boolean, default=0)
    req_edit = Column(Boolean, default=0)
    req_beep = Column(Boolean, default=0)
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
    if session.query(user).filter(user.username == username).all():
        return 1
    else:
        try:
            newUser = user(username=username, pass_hash=password_hash)
            session.add(newUser)
        except:
            session.rollback()
            return 2
        else:
            session.commit()
            return 0
        return -1

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

def getPermissions(username, token):
    result = ""
    permissions_dict = getAccessStructure(username)
    for perm in permissions_dict:
        if permissions_dict[perm]:
            result += perm + ", "
    result = result[:-2]
    return result

def requestPermissions(username, token, req_admin, req_edit, req_beep):
    sought_user = session.query(user).filter(user.username == username).all()
    if sought_user:
        sought_user=sought_user[0]
        if sought_user.token == token:
            try:
                sought_user.req_admin = req_admin
                sought_user.req_edit = req_edit
                sought_user.req_beep = req_beep
            except:
                session.rollback()
                return -1 #server error
            else:
                session.commit()
                return 0
        else:
            return 1 #invalid token
    else:
        return 2 #user not found

def getPending(username):
    sought_user = session.query(user).filter(user.username == username).all()
    if sought_user:
        sought_user=sought_user[0]
        if sought_user.req_admin + sought_user.req_edit + sought_user.req_beep:
            return 1
        else:
            return 0
    else:
        return -1 #user not found

def getPendingUsersNumber():
    users = session.query(user).filter(or_(or_(user.req_admin , user.req_beep), user.req_edit)).all()
    return str(len(users))

def generateUsersJSON():
    output = '{'
    users = session.query(user).all()
    for u in users:
        output += '"' + u.username + '":{"username":"'
        output += str(u.username) + '",'

        output += '"id":'+str(u.ID)

        output += ',"permissions":{'
        output += '"is_admin":' + str(int(u.is_admin))
        output += ',"can_view_map":' + str(int(u.can_view_map))
        output += ',"can_edit_features":' + str(int(u.can_edit_features))
        output += ',"can_beep":' + str(int(u.can_beep))
        output += '},'

        output += '"requests":{'
        output += '"req_admin":' + str(int(u.req_admin))
        output += ',"req_edit":' + str(int(u.req_edit))
        output += ',"req_beep":' + str(int(u.req_beep))
        output += '}'

        output += '}'
        if u != users[-1]:
            output += ','

    output += '}'
    return output

def approveUser(uid):
    sought_user = session.query(user).filter(user.ID == uid).all()
    if sought_user:
        sought_user=sought_user[0]
        sought_user.can_edit_features = max(sought_user.can_edit_features, sought_user.req_edit)
        sought_user.is_admin = max(sought_user.is_admin, sought_user.req_admin)
        sought_user.can_beep = max(sought_user.can_beep, sought_user.req_beep)

        sought_user.req_edit = sought_user.req_admin = sought_user.req_beep = 0
        return 0
    else:
        return None #user not found
    return 1

def denyUser(uid):
    sought_user = session.query(user).filter(user.ID == uid).all()
    if sought_user:
        sought_user=sought_user[0]
        sought_user.req_edit = sought_user.req_admin = sought_user.req_beep = 0
        return 0
    else:
        return None #user not found
    return 1

def revokeUserPrivileges(uid):
    sought_user = session.query(user).filter(user.ID == uid).all()
    if sought_user:
        sought_user=sought_user[0]
        sought_user.req_edit = sought_user.req_admin = sought_user.req_beep = 0
        sought_user.can_edit_features = 0
        sought_user.is_admin = 0
        sought_user.can_beep = 0
        return 0
    else:
        return None #user not found
    return 1

def deleteUser(uid):
    sought_user = session.query(user).filter(user.ID == uid).all()
    if sought_user:
        sought_user=sought_user[0]
        try:
            session.delete(sought_user)
        except:
            session.rollback()
            return 1
        else:
            session.commit()
            return 0
    else:
        return 2 #user not found
    return 1