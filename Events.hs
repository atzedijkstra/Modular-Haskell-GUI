{-# OPTIONS_GHC -XExistentialQuantification #-}

-- | This module defines the events that can occur in the GUI.

module Events (
    Event (..)
  ) where

import {-# SOURCE #-} Properties.Properties
import {-# SOURCE #-} Properties.Props

-- | Define all events that can occur.
data Event = MotionEvent
           | ScrollEvent
           | EnterEvent
           | LeaveEvent
           | KeyPressEvent
           | KeyReleaseEvent
           | ButtonPressEvent
           | ButtonReleaseEvent
           | FocusEvent
           | BlurEvent
           | forall a p. Property p => Change (a -> p)
           | ChangeEvent Prop

instance Eq Event where
  MotionEvent == MotionEvent = True
  ScrollEvent == ScrollEvent = True
  EnterEvent == EnterEvent = True
  LeaveEvent == LeaveEvent = True
  KeyPressEvent == KeyPressEvent = True
  KeyReleaseEvent == KeyReleaseEvent = True
  ButtonPressEvent == ButtonPressEvent = True
  ButtonReleaseEvent == ButtonReleaseEvent = True
  FocusEvent == FocusEvent = True
  BlurEvent == BlurEvent = True
  Change a == Change b = sameProp (toProp $ a undefined) (toProp $ b undefined)
  ChangeEvent a == ChangeEvent b = sameProp a b
  _ == _ = False

instance Show Event where
  show MotionEvent = "MotionEvent"
  show ScrollEvent = "ScrollEvent"
  show EnterEvent = "EnterEvent"
  show KeyPressEvent = "KeyPressEvent"
  show KeyReleaseEvent = "KeyReleaseEvent"
  show ButtonPressEvent = "ButtonPressEvent"
  show ButtonReleaseEvent = "ButtonReleaseEvent"
  show FocusEvent = "FocusEvent"
  show BlurEvent = "BlurEvent"
  show (Change _) = "Change"
  show (ChangeEvent _) = "ChangeEvent"
