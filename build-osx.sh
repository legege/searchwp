#!/bin/bash
echo "tell application \"Firefox\" to quit" | osascript
ant all
echo "tell application \"Firefox\" to activate" | osascript